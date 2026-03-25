const cron = require('node-cron');
const Donation = require('../models/Donation');

// Run every hour
const startExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // Find all Available or Pending donations where expiryTime is in the past
      const result = await Donation.updateMany(
        { 
          status: { $in: ['Available', 'Pending'] },
          expiryTime: { $lt: now }
        },
        { $set: { status: 'Expired' } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Cron Job: Marked ${result.modifiedCount} donations as Expired.`);
      }
    } catch (error) {
      console.error('Error in expiry cron job:', error.message);
    }
  });

  console.log('Expiry cron job initialized.');
};

module.exports = startExpiryJob;
