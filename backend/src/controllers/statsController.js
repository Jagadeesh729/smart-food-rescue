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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (role === 'Donor') {
      const donorDonationIds = await Donation.find({ donorId: req.user._id }).distinct('_id');

      const [
        totalDonations,
        activeDonations,
        requestsReceived,
        completedDonations,
        expiredDonations,
        donationsToday,
        requestsToday,
        completedToday
      ] = await Promise.all([
        Donation.countDocuments({ donorId: req.user._id }),
        Donation.countDocuments({
          donorId: req.user._id,
          status: { $in: ['Pending', 'Requested', 'Accepted', 'PickedUp'] }
        }),
        Request.countDocuments({ donationId: { $in: donorDonationIds } }),
        Donation.countDocuments({ donorId: req.user._id, status: 'Completed' }),
        Donation.countDocuments({ donorId: req.user._id, status: 'Expired' }),
        Donation.countDocuments({ donorId: req.user._id, createdAt: { $gte: todayStart } }),
        Request.countDocuments({ donationId: { $in: donorDonationIds }, createdAt: { $gte: todayStart } }),
        Donation.countDocuments({ donorId: req.user._id, status: 'Completed', updatedAt: { $gte: todayStart } })
      ]);

      stats = { 
        totalDonations, 
        activeDonations, 
        requestsReceived, 
        completedDonations, 
        expiredDonations,
        donationsToday,
        requestsToday,
        completedToday
      };

    } else if (role === 'NGO') {
      const [
        availableDonations,
        activeRequests,
        completedRequests,
        todayPickups,
        requestsToday
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
          updatedAt: { $gte: todayStart }
        }),
        Request.countDocuments({
          ngoId: req.user._id,
          createdAt: { $gte: todayStart }
        })
      ]);

      stats = { 
        availableDonations, 
        activeRequests, 
        completedRequests, 
        todayPickups,
        requestsToday
      };

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

// @desc    Get public platform statistics for the home page
// @route   GET /api/stats/public
// @access  Public
const getPublicStats = async (req, res) => {
  try {
    const [
      totalDonations,
      completedDonations,
      totalNGOs,
      totalDonors,
      activeDonations
    ] = await Promise.all([
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'Completed' }),
      User.countDocuments({ role: 'NGO' }),
      User.countDocuments({ role: 'Donor' }),
      Donation.countDocuments({
        status: { $in: ['Pending', 'Requested', 'Accepted', 'PickedUp'] },
        expiryTime: { $gt: new Date() }
      })
    ]);

    // Estimate meals: assume avg 2.5 meals per completed donation unit
    const estimatedMeals = Math.round(completedDonations * 12);

    res.json({
      totalDonations,
      completedDonations,
      activeDonations,
      totalNGOs,
      totalDonors,
      estimatedMeals
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getPublicStats
};

