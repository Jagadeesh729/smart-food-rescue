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
      const totalDonations = await Donation.countDocuments({ donorId: req.user._id });
      const completedDonations = await Donation.countDocuments({ donorId: req.user._id, status: 'Claimed' });
      const requestsReceived = await Request.countDocuments({ 
        donationId: { $in: await Donation.find({ donorId: req.user._id }).distinct('_id') } 
      });

      stats = { totalDonations, completedDonations, requestsReceived };

    } else if (role === 'NGO') {
      const activeRequests = await Request.countDocuments({ ngoId: req.user._id, status: { $in: ['Pending', 'Accepted'] } });
      const completedRequests = await Request.countDocuments({ ngoId: req.user._id, status: 'Completed' });
      const availableDonations = await Donation.countDocuments({ status: 'Available' });

      stats = { activeRequests, completedRequests, availableDonations };

    } else if (role === 'Admin') {
      const totalUsers = await User.countDocuments();
      const totalDonations = await Donation.countDocuments();
      const completedDonations = await Donation.countDocuments({ status: 'Claimed' });
      const totalNGOs = await User.countDocuments({ role: 'NGO' });
      
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
