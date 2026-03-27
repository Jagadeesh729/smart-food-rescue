const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/**
 * Send an email with robust error logging and SMTP trace
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: `"Smart Food Rescue" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    };

    // Ensure transporter is ready every time we send in production
    await transporter.verify();

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ SMTP SUCCESS: ${to}`);
    console.log(`🔹 Message-ID: ${info.messageId}`);
    console.log(`🔹 Server Response: ${info.response}`);
    console.log(`🔹 Envelope (To): ${JSON.stringify(info.envelope.to)}`);
    return true;
  } catch (error) {
    console.error(`❌ Error sending email to ${to}:`, error.message);
    if (error.code === 'EAUTH') {
      console.error('CRITICAL: SMTP Authentication Failed. Check Gmail App Password.');
    } else if (error.code === 'ESOCKET') {
      console.error('CRITICAL: SMTP Connection Timeout. Is Render blocking port 465?');
    }
    return false;
  }
};

/**
 * Specialized helper for verification OTPs with professional styling
 */
const sendVerificationEmail = async (to, name, otpCode, isResend = false) => {
  const subject = isResend 
    ? `New Verification Code: ${otpCode} - Smart Food Rescue` 
    : `Verify Your Smart Food Rescue Account: ${otpCode}`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 40px; border: 1px solid #eef2f6; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h2 style="color: #059669; font-size: 24px; font-weight: 800; margin: 0;">Smart Food Rescue</h2>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Connecting Surplus to Sustainability</p>
      </div>
      
      <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">Hi <strong>${name || 'Rescue Hero'}</strong>,</p>
      <p style="color: #475569; font-size: 15px; line-height: 1.6;">
        ${isResend ? 'You requested a new verification code.' : 'Welcome to the network! Please verify your email to start donating or receiving food.'}
      </p>
      
      <div style="background: #f0fdf4; border: 2px dashed #10b981; border-radius: 12px; padding: 32px; text-align: center; margin: 30px 0;">
        <p style="color: #065f46; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 12px;">Your One-Time Password</p>
        <h1 style="font-size: 48px; letter-spacing: 14px; color: #064e3b; margin: 0; font-family: monospace;">${otpCode}</h1>
      </div>
      
      <p style="color: #64748b; font-size: 13px; text-align: center; margin-top: 20px;">
        This code expires in <strong>10 minutes</strong>.<br/>
        If you didn't request this, you can safely ignore this email.
      </p>
      
      <div style="border-top: 1px solid #f1f5f9; margin-top: 40px; pt-20px; text-align: center;">
        <p style="color: #94a3b8; font-size: 11px;">© 2026 Smart Food Rescue Network. All rights reserved.</p>
      </div>
    </div>
  `;

  return sendEmail(to, subject, html);
};

module.exports = {
  transporter,
  sendEmail,
  sendVerificationEmail
};
