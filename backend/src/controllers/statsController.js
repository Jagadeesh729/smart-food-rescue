const Donation = require('../models/Donation');
const Request = require('../models/Request');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const role = req.user.role;
    let stats = {};

    if (role === 'Donor') {
      const donorDonationIds = await Donation.find({ donorId: req.user._id }).distinct('_id');

      const [
        totalDonations,
        activeDonations,
        requestsReceived,
        completedDonations,
        expiredDonations
      ] = await Promise.all([
        Donation.countDocuments({ donorId: req.user._id }),
        Donation.countDocuments({
          donorId: req.user._id,
          status: { $in: ['Pending', 'Requested', 'Accepted', 'PickedUp'] }
        }),
        Request.countDocuments({ donationId: { $in: donorDonationIds } }),
        Donation.countDocuments({ donorId: req.user._id, status: 'Completed' }),
        Donation.countDocuments({ donorId: req.user._id, status: 'Expired' })
      ]);

      stats = { totalDonations, activeDonations, requestsReceived, completedDonations, expiredDonations };

    } else if (role === 'NGO') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        availableDonations,
        activeRequests,
        completedRequests,
        todayPickups
      ] = await Promise.all([
        Donation.countDocuments({
          status: { $in: ['Pending', 'Requested'] },
          expiryTime: { $gt: new Date() }
        }),
        Request.countDocuments({
          ngoId: req.user._id,
          status: { $in: ['Pending', 'Accepted', 'PickedUp'] }
        }),
        Request.countDocuments({ ngoId: req.user._id, status: 'Completed' }),
        Request.countDocuments({
          ngoId: req.user._id,
          status: 'Completed',
          updatedAt: { $gte: today }
        })
      ]);

      stats = { availableDonations, activeRequests, completedRequests, todayPickups };

    } else if (role === 'Admin') {
      const [totalUsers, totalDonations, completedDonations, totalNGOs] = await Promise.all([
        User.countDocuments(),
        Donation.countDocuments(),
        Donation.countDocuments({ status: 'Completed' }),
        User.countDocuments({ role: 'NGO' })
      ]);

      stats = { totalUsers, totalDonations, completedDonations, totalNGOs };
    }

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats
};
