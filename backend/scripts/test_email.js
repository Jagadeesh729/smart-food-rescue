require('dotenv').config();
const nodemailer = require('nodemailer');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('❌ ERROR: EMAIL_USER or EMAIL_PASS environment variables are missing!');
  process.exit(1);
}

console.log(`🔍 Testing SMTP for: ${EMAIL_USER}`);
console.log('------------------------------------');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

const testMail = async () => {
  try {
    // 1. Verify connection
    console.log('⏳ Verifying connection to Gmail SMTP...');
    await transporter.verify();
    console.log('✅ SMTP Connection Verified!');

    // 2. Send test email
    const mailOptions = {
      from: `"Smart Food Rescue Test" <${EMAIL_USER}>`,
      to: EMAIL_USER, // Send to yourself
      subject: '🚀 SMTP Configuration Test - Smart Food Rescue',
      text: 'If you see this, your Gmail SMTP settings (App Password) are working correctly!'
    };

    console.log(`⏳ Sending test email to ${EMAIL_USER}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Test Email Sent Successfully!`);
    console.log(`📄 Response: ${info.response}`);
    console.log('------------------------------------');
    console.log('🎉 SUCCESS: Your email service is correctly configured.');
  } catch (error) {
    console.error('------------------------------------');
    console.error('❌ SMTP TEST FAILED!');
    console.error(`Error Code: ${error.code || 'UNKNOWN'}`);
    console.error(`Error Message: ${error.message}`);
    
    if (error.code === 'EAUTH') {
      console.error('\n💡 HINT: Authentication failed. This usually means:');
      console.error('  1. You are using your normal Gmail password (WRONG).');
      console.error('  2. You need to create a "16-character App Password".');
      console.error('  3. Go to: https://myaccount.google.com/apppasswords');
    }
    
    process.exit(1);
  }
};

testMail();
