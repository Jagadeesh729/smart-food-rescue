const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../services/emailService');

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
      // Send OTP via email (Non-blocking background task)
      setImmediate(() => {
        sendEmail(
          email,
          'Verify Your Smart Food Rescue Account',
          `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
            <h2 style="color:#059669;margin-bottom:8px;">Smart Food Rescue</h2>
            <p style="color:#374151;">Welcome, <strong>${name}</strong>! Please verify your email to start rescuing food.</p>
            <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
              <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Your One-Time Password</p>
              <h1 style="font-size:42px;letter-spacing:12px;color:#065f46;margin:0;">${otpCode}</h1>
            </div>
            <p style="color:#6b7280;font-size:13px;">This OTP expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
          </div>`
        ).catch(err => console.error('Background Email Error:', err.message));
      });
      console.log(`OTP for ${email} is ${otpCode}`); // keep as fallback log
      res.status(201).json({
        message: 'User registered successfully. Please verify your email.',
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

    if (user.otp.code !== otp || user.otp.expiresAt < new Date()) {
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
        return res.status(401).json({ message: 'Please verify your email first', userId: user._id });
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

    // Send Email (Background task)
    setImmediate(() => {
      sendEmail(
        user.email,
        'Your New Verification Code - Smart Food Rescue',
        `<div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:12px;">
          <h2 style="color:#059669;margin-bottom:8px;">Smart Food Rescue</h2>
          <p style="color:#374151;">Here is your new verification code.</p>
          <div style="background:#f0fdf4;border:1px solid #6ee7b7;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">Your New One-Time Password</p>
            <h1 style="font-size:42px;letter-spacing:12px;color:#065f46;margin:0;">${otpCode}</h1>
          </div>
          <p style="color:#6b7280;font-size:13px;">This OTP expires in <strong>10 minutes</strong>.</p>
        </div>`
      ).catch(err => console.error('Background Email Error:', err.message));
    });

    res.json({ message: 'New OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyOTP,
  resendOTP,
  loginUser,
  getUserProfile,
  checkEmail
};
