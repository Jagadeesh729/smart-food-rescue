const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔌 Database: Connecting to MongoDB Atlas...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ Database: MongoDB Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Database Connection Error: ${error.message}`);
    throw error;
  }
};

module.exports = connectDB;
