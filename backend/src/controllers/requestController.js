const Request = require('../models/Request');
const Donation = require('../models/Donation');
const { getIo } = require('../sockets/socketHandler');

// @desc    Create a new request (claim a donation)
// @route   POST /api/requests
// @access  Private (NGO only)
const createRequest = async (req, res) => {
  try {
    const { donationId, message } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    
    if (donation.status !== 'Available') {
      return res.status(400).json({ message: 'Donation is no longer available' });
    }

    // Check if NGO already requested this
    const existingReq = await Request.findOne({ donationId, ngoId: req.user._id });
    if (existingReq) {
      return res.status(400).json({ message: 'You have already requested this donation' });
    }

    const request = await Request.create({
      donationId,
      ngoId: req.user._id,
      message
    });

    // Notify Donor in real-time
    const io = getIo();
    io.to(`user_${donation.donorId}`).emit('newRequest', { donationId, requestId: request._id, ngoName: req.user.name });

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get requests for a user (Donor sees requests on their donations, NGO sees their own requests)
// @route   GET /api/requests
// @access  Private
const getRequests = async (req, res) => {
  try {
    if (req.user.role === 'Donor') {
      const donations = await Donation.find({ donorId: req.user._id }).select('_id');
      const donationIds = donations.map(d => d._id);
      
      const requests = await Request.find({ donationId: { $in: donationIds } })
        .populate('donationId')
        .populate('ngoId', 'name email phone address');
        
      return res.json(requests);
    } else if (req.user.role === 'NGO') {
      const requests = await Request.find({ ngoId: req.user._id })
        .populate({
          path: 'donationId',
          populate: { path: 'donorId', select: 'name email phone address' }
        });
      return res.json(requests);
    }
    
    res.json([]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update request status
// @route   PUT /api/requests/:id/status
// @access  Private
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body; // Pending -> Accepted -> PickedUp -> Completed
    const request = await Request.findById(req.params.id).populate('donationId');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

    // Side effects based on status
    if (status === 'Accepted') {
      // Mark donation as Pending or Claimed depending on flow
      await Donation.findByIdAndUpdate(request.donationId._id, { status: 'Pending' });
      
      // Reject other requests
      await Request.updateMany(
        { donationId: request.donationId._id, _id: { $ne: request._id } },
        { status: 'Rejected' }
      );
    } else if (status === 'Completed') {
      await Donation.findByIdAndUpdate(request.donationId._id, { status: 'Claimed' });
    }

    // Notify the other party
    const io = getIo();
    const notifyUserId = req.user.role === 'Donor' ? request.ngoId : request.donationId.donorId;
    io.to(`user_${notifyUserId}`).emit('statusUpdate', { requestId: request._id, status, donationTitle: request.donationId.title });

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequestStatus
};
