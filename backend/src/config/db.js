const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`⚠️ MongoDB Connection Failed: ${error.message}`);
    // Do NOT exit the process. This ensures that the web server can boot,
    // pass platform health checks, and attempt background reconnections.
  }
};

module.exports = connectDB;
