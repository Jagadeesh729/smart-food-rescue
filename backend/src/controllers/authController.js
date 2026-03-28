const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');
const { sendEmail, sendVerificationEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate simple 6 digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      phone,
      address,
      otp: {
        code: otpCode,
        expiresAt: otpExpiresAt
      }
    });

    if (user) {
      // ⚡ IMMEDIATE FIRE-AND-FORGET WITH NO EVENT LOOP BLOCKING
      setImmediate(() => {
        sendVerificationEmail(email, name, otpCode)
          .then(sent => {
            if (!sent) console.error(`⚠️ [AUTH] Registration OTP failed in background for ${email}`);
            else console.log(`✅ [AUTH] Registration OTP sent in background to: ${email}`);
          })
          .catch(err => console.error(`❌ [AUTH] Registration Email Background Fail:`, err.message));
      });
      
      console.log(`[AUTH] New User Creation (Pending): ${email} | OTP: ${otpCode}`);
      res.status(201).json({
        message: 'Account created! Please verify your email. (Check Spam folder)',
        userId: user._id
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    // Rescue OTP: Allows the developer to bypass email blocks in ANY environment.
    const isRescueOTP = otp === '999999';

    if (!isRescueOTP && (user.otp.code !== otp || user.otp.expiresAt < new Date())) {
      console.warn(`[AUTH] Verification failed for ${user.email}. Expected: ${user.otp.code}, Received: ${otp}`);
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (!user.isVerified) {
        // Generate NEW OTP instead of just erroring
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = {
          code: otpCode,
          expiresAt: otpExpiresAt
        };
        await user.save();

        // ⚡ NON-BLOCKING FIRE-AND-FORGET WITH NO EVENT LOOP BLOCKING
        setImmediate(() => {
          sendVerificationEmail(email, user.name, otpCode, true)
            .then(sent => {
              if (!sent) console.error(`⚠️ [AUTH] Login OTP failed in background for ${email}`);
              else console.log(`✅ [AUTH] Login OTP sucessfully sent in background to: ${email}`);
            })
            .catch(err => console.error(`❌ [AUTH] Login OTP Background Fail:`, err.message));
        });

        return res.status(401).json({ 
          message: 'Please verify your account. A code has been sent to your email (Check Spam).', 
          userId: user._id 
        });
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check if email exists
// @route   GET /api/auth/check-email
// @access  Public
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email required' });
    
    const user = await User.findOne({ email });
    res.json({ exists: !!user, isVerified: user ? user.isVerified : false });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend OTP
// @route   POST /api/auth/resend-otp
// @access  Public
const resendOTP = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: 'User ID is required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    // --- Basic Rate Limiting ---
    const currentTime = new Date();
    const fifteenMinsAgo = new Date(currentTime.getTime() - 15 * 60 * 1000);
    
    // Reset count if last resend was > 15 mins ago
    if (user.otp.lastResendAt && user.otp.lastResendAt < fifteenMinsAgo) {
      user.otp.resendCount = 0;
    }

    if (user.otp.resendCount >= 3) {
      return res.status(429).json({ message: 'Too many resend attempts. Please try again in 15 minutes.' });
    }

    // --- Generate new OTP ---
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(currentTime.getTime() + 10 * 60 * 1000);

    user.otp.code = otpCode;
    user.otp.expiresAt = otpExpiresAt;
    user.otp.resendCount += 1;
    user.otp.lastResendAt = currentTime;
    
    await user.save();

    // ⚡ NON-BLOCKING RESEND
    sendVerificationEmail(user.email, user.name, otpCode, true)
      .then(sent => {
        if (!sent) console.error(`⚠️ [AUTH] Resend OTP failed in background for ${user.email}`);
        else console.log(`✅ [AUTH] Resend OTP successfully sent in background to: ${user.email}`);
      })
      .catch(err => console.error(`❌ [AUTH] Resend Email Background Fail:`, err.message));

    res.json({ message: 'A new code is being sent to your email (Check Spam folder).' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google login/register
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, sub: googleId, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (!user) {
      // Create new user for first time Google login
      user = await User.create({
        name,
        email,
        googleId,
        picture, // Save Google profile picture
        isVerified: true, // Google email is already verified
        role: 'Donor', // Default role
      });
    } else {
      // Update googleId and picture if not already set or changed
      let hasUpdate = false;
      if (!user.googleId) {
        user.googleId = googleId;
        hasUpdate = true;
      }
      if (picture && user.picture !== picture) {
        user.picture = picture;
        hasUpdate = true;
      }
      
      if (hasUpdate) await user.save();
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      picture: picture,
      token: generateToken(user._id),
    });

  } catch (error) {
    console.error('Google Auth Error:', error.message);
    res.status(400).json({ message: 'Google authentication failed' });
  }
};

// @desc    Test SMTP connection
// @route   GET /api/auth/test-smtp
// @access  Public
const testSMTP = async (req, res) => {
  try {
    const { sendEmail } = require('../services/emailService');
    const nodemailer = require('nodemailer');
    
    // Instead of creating a new transporter, use the existing one to be SURE it's working
    const { transporter } = require('../services/emailService'); // Assuming it's exported or we should export it
    
    await transporter.verify();
    
    // Attempt to send a real test email to the system account
    const info = await transporter.sendMail({
      from: `"Smart Food Rescue Support" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '🛠️ SMTP Diagnostic Test - Smart Food Rescue',
      text: 'If you are reading this, your SMTP configuration is 100% CORRECT!'
    });

    res.json({ 
      success: true, 
      message: '✅ SMTP Connection Verified! A test email has been sent to your account.',
      details: info.response,
      user: process.env.EMAIL_USER ? 'Set' : 'Missing',
      pass: process.env.EMAIL_PASS ? 'Set' : 'Missing'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: '❌ SMTP Configuration Error',
      error: error.message,
      code: error.code,
      hint: error.code === 'EAUTH' ? 'Invalid Gmail Credentials. Check your App Password.' : 'Connection failed. Check Render Environment Variables.'
    });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  getUserProfile,
  checkEmail,
  googleLogin,
  testSMTP
};
