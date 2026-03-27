const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkUser = async () => {
  const email = 'kundaharikrishna38@gmail.com';
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing');
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;
    const user = await db.collection('users').findOne({ email });
    
    if (user) {
      console.log('=== USER FOUND ===');
      console.log(`Email: ${user.email}`);
      console.log(`Is Verified: ${user.isVerified}`);
      console.log(`OTP Code: ${user.otp ? user.otp.code : 'NULL'}`);
      console.log(`OTP Expires: ${user.otp ? user.otp.expiresAt : 'NULL'}`);
      console.log('==================');
    } else {
      console.log(`❌ User ${email} not found.`);
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkUser();
