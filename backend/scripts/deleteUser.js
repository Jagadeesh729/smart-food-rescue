const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const deleteSpecificUser = async () => {
  const emailToDelete = 'kundaharikrishna38@gmail.com';
  
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log(`⏳ Connecting to MongoDB to delete ${emailToDelete}...`);
    await mongoose.connect(process.env.MONGODB_URI);
    
    const db = mongoose.connection.db;

    // 1. Find the user first to get their ID if needed for other collections
    const user = await db.collection('users').findOne({ email: emailToDelete });
    
    if (!user) {
      console.log(`ℹ️ User ${emailToDelete} not found in database.`);
    } else {
      const userId = user._id;

      // 2. Delete associated donations
      const donationResult = await db.collection('donations').deleteMany({ donor: userId });
      console.log(`🧹 Deleted ${donationResult.deletedCount} donations associated with the user.`);

      // 3. Delete associated requests
      const requestResult = await db.collection('requests').deleteMany({ $or: [{ donor: userId }, { ngo: userId }] });
      console.log(`🧹 Deleted ${requestResult.deletedCount} requests associated with the user.`);

      // 4. Finally delete the user
      await db.collection('users').deleteOne({ _id: userId });
      console.log(`✅ Successfully deleted user: ${emailToDelete}`);
    }

    console.log('\n✨ Cleanup completed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during targeted cleanup:', error.message);
    process.exit(1);
  }
};

deleteSpecificUser();
