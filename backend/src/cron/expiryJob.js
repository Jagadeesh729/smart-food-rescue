const cron = require('node-cron');
const Donation = require('../models/Donation');

// Run every hour to mark expired donations
const startExpiryJob = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // FIX: 'Available' was never a valid Donation status. Valid pending statuses are 'Pending' and 'Requested'.
      // We also expire 'Requested' donations so NGOs don't see ghost requests for expired food.
      const result = await Donation.updateMany(
        {
          status: { $in: ['Pending', 'Requested'] },
          expiryTime: { $lt: now }
        },
        { $set: { status: 'Expired' } }
      );

      if (result.modifiedCount > 0) {
        console.log(`[Cron] Marked ${result.modifiedCount} donation(s) as Expired.`);
      }
    } catch (error) {
      console.error('[Cron] Error in expiry job:', error.message);
    }
  });

  console.log('[Cron] Donation expiry job initialized (runs every hour).');
};

module.exports = startExpiryJob;
