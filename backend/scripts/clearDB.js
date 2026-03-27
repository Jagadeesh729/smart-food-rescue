const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to Database.');

    const collections = ['users', 'donations', 'requests'];
    
    for (const collectionName of collections) {
      try {
        await mongoose.connection.collection(collectionName).deleteMany({});
        console.log(`🧹 Cleared collection: ${collectionName}`);
      } catch (err) {
        console.warn(`⚠️ Could not clear ${collectionName}: ${err.message}`);
      }
    }

    console.log('\n✨ Database is now EMPTY and ready for a fresh start.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    process.exit(1);
  }
};

clearDatabase();
