const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the correct path
dotenv.config({ path: path.join(__dirname, '../.env') });

const testSMTP = async () => {
  console.log('--- SMTP Diagnostic Tool ---');
  console.log(`User: ${process.env.EMAIL_USER}`);
  console.log(`Pass: ${process.env.EMAIL_PASS ? '******** (Hidden)' : 'MISSING'}`);
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    console.log('Testing connection...');
    await transporter.verify();
    console.log('✅ SMTP Connection verified successfully!');

    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"Smart Food Rescue Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: '🛠️ SMTP Test - Smart Food Rescue',
      text: 'If you received this, your SMTP configuration is correct. Great job!',
      html: '<b>If you received this, your SMTP configuration is correct. Great job!</b>'
    });

    console.log(`✅ Email sent: ${info.messageId}`);
  } catch (error) {
    console.error('❌ SMTP Test Failed:');
    console.error(error.message);
    if (error.code === 'EAUTH') {
      console.log('\n--- Troubleshooting ---');
      console.log('1. Make sure you are using a Gmail "App Password", not your regular password.');
      console.log('2. Ensure "2nd Step Verification" is enabled on your Google Account.');
      console.log('3. Check for typos in EMAIL_USER or EMAIL_PASS in your .env file.');
    }
  }
};

testSMTP();
