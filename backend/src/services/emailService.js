const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * EMAIL CONFIGURATION LOGIC
 * Supports Multi-Provider to bypass Render/Vercel firewall blocks.
 */
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || 'smtp'; // 'brevo', 'resend', or 'smtp'
const API_KEY = process.env.EMAIL_API_KEY;

// Nodemailer Transporter (Fallback for SMTP)
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 5000,
  greetingTimeout: 5000,
  socketTimeout: 5000
});

// Diagnostic check on startup
if (EMAIL_PROVIDER === 'smtp') {
  transporter.verify()
    .then(() => console.log('✅ SMTP Ready (Warning: Might be blocked on Render Free Tier)'))
    .catch(err => console.error('⚠️ SMTP Warning:', err.message));
} else {
  console.log(`🚀 Email Provider set to: ${EMAIL_PROVIDER.toUpperCase()} (HTTP API Mode)`);
}

/**
 * Send an email via Brevo's HTTP API (Bypasses Port 587 firewalls)
 */
const sendViaBrevo = async (to, subject, html) => {
  try {
    const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender: { name: "Smart Food Rescue", email: process.env.EMAIL_USER },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    }, {
      headers: {
        'api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log(`✅ Brevo API Success: ${to} (Message-ID: ${response.data.messageId})`);
    return true;
  } catch (error) {
    console.error(`❌ Brevo API Error:`, error.response?.data || error.message);
    return false;
  }
};

/**
 * Primary sending function with intelligent fallback
 */
const sendEmail = async (to, subject, html) => {
  // 1. Try HTTP API if configured (Highly Recommended for Render)
  if (EMAIL_PROVIDER === 'brevo' && API_KEY) {
    return sendViaBrevo(to, subject, html);
  }

  // 2. Fallback to standard SMTP (May hang/fail on Render Free Tier)
  try {
    const mailOptions = {
      from: `"Smart Food Rescue" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };
    await transporter.sendMail(mailOptions);
    console.log(`✅ SMTP Success: ${to}`);
    return true;
  } catch (error) {
    console.error(`❌ SMTP Failed targeting ${to}:`, error.message);
    return false;
  }
};

/**
 * Professional HTML template for OTP verification
 */
const sendVerificationEmail = async (to, name, otpCode, isResend = false) => {
  const subject = isResend 
    ? `Action Required: Verification Code ${otpCode}` 
    : `Welcome! Your Smart Food Rescue Code is ${otpCode}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 500px; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #10b981;">Smart Food Rescue</h2>
      <p>Hello <strong>${name || 'Hero'}</strong>,</p>
      <p>Use the following code to verify your account:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px;">
        ${otpCode}
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
};

module.exports = { sendEmail, sendVerificationEmail };
