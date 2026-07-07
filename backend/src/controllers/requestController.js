const Request = require('../models/Request');
const Donation = require('../models/Donation');
const { getIo } = require('../sockets/socketHandler');

// @desc    Create a new request (claim a donation)
// @route   POST /api/requests
// @access  Private (NGO only)
const createRequest = async (req, res) => {
  try {
    if (req.user.role !== 'NGO') {
      return res.status(403).json({ message: 'Only NGOs are authorized to request food donations' });
    }
    
    const { donationId, message } = req.body;

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    // FIX: 'Available' was never a valid status. Valid values are: Pending, Requested, Accepted, PickedUp, Completed, Expired
    if (donation.status !== 'Pending' && donation.status !== 'Requested') {
      return res.status(400).json({ message: 'Donation is no longer available for requests' });
    }

    if (donation.expiryTime < new Date()) {
      return res.status(400).json({ message: 'This donation has expired' });
    }

    // Check if NGO already requested this donation
    const existingReq = await Request.findOne({ donationId, ngoId: req.user._id });
    if (existingReq) {
      return res.status(400).json({ message: 'You have already requested this donation' });
    }

    const request = await Request.create({
      donationId,
      ngoId: req.user._id,
      message
    });

    // Update donation status to 'Requested'
    donation.status = 'Requested';
    await donation.save();

    // Notify Donor in real-time
    try {
      const io = getIo();
      io.to(`user_${donation.donorId}`).emit('newRequest', {
        donationId,
        requestId: request._id,
        ngoName: req.user.name,
        donationTitle: donation.title,
        status: 'Requested'
      });
    } catch (socketErr) {
      console.warn('Socket notification failed (non-critical):', socketErr.message);
    }

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
        })
        .sort({ createdAt: -1 });
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
    const { status } = req.body;
    const request = await Request.findById(req.params.id).populate('donationId');

    if (!request) return res.status(404).json({ message: 'Request not found' });

    // FIX: Role-based authorization
    // Only Donor can Accept/Reject a request
    // Only NGO (the one who made the request) can mark PickedUp or Completed
    if (req.user.role === 'Donor') {
      const donorOwnsDonation = request.donationId.donorId.toString() === req.user._id.toString();
      if (!donorOwnsDonation) {
        return res.status(403).json({ message: 'Not authorized to update this request' });
      }
      if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Donors can only Accept or Reject requests' });
      }
    } else if (req.user.role === 'NGO') {
      const ngoOwnsRequest = request.ngoId.toString() === req.user._id.toString();
      if (!ngoOwnsRequest) {
        return res.status(403).json({ message: 'Not authorized to update this request' });
      }
      if (!['PickedUp', 'Completed'].includes(status)) {
        return res.status(400).json({ message: 'NGOs can only mark requests as PickedUp or Completed' });
      }
    } else {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = status;
    await request.save();

    // Side effects based on status
    if (status === 'Accepted') {
      await Donation.findByIdAndUpdate(request.donationId._id, { status: 'Accepted' });
      // Reject all other pending requests for this donation
      await Request.updateMany(
        { donationId: request.donationId._id, _id: { $ne: request._id } },
        { status: 'Rejected' }
      );
    } else if (status === 'PickedUp') {
      await Donation.findByIdAndUpdate(request.donationId._id, { status: 'PickedUp' });
    } else if (status === 'Completed') {
      await Donation.findByIdAndUpdate(request.donationId._id, { status: 'Completed' });
    } else if (status === 'Rejected') {
      // If all requests are rejected, reset donation to Pending
      const otherActiveRequests = await Request.find({
        donationId: request.donationId._id,
        _id: { $ne: request._id },
        status: { $in: ['Pending'] }
      });
      if (otherActiveRequests.length === 0) {
        await Donation.findByIdAndUpdate(request.donationId._id, { status: 'Pending' });
      }
    }

    // Notify the other party via socket
    try {
      const io = getIo();
      const notifyUserId = req.user.role === 'Donor'
        ? request.ngoId
        : request.donationId.donorId;
      io.to(`user_${notifyUserId}`).emit('statusUpdate', {
        requestId: request._id,
        status,
        donationId: request.donationId._id,
        donationTitle: request.donationId.title
      });
    } catch (socketErr) {
      console.warn('Socket notification failed (non-critical):', socketErr.message);
    }

    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a request (cancel claim)
// @route   DELETE /api/requests/:id
// @access  Private (NGO only)
const deleteRequest = async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    // Only the NGO who made the request can cancel it
    if (request.ngoId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // FIX: Only allow cancel when Request status is 'Pending' (not 'Requested' which is a Donation status)
    if (request.status !== 'Pending') {
      return res.status(400).json({ message: 'Cannot cancel a request that has already been accepted or completed' });
    }

    const donationId = request.donationId;
    await request.deleteOne();

    // Check if there are other active requests for this donation
    const otherRequests = await Request.find({ donationId, status: 'Pending' });
    if (otherRequests.length === 0) {
      // Reset donation to Pending so it shows up in browse again
      await Donation.findByIdAndUpdate(donationId, { status: 'Pending' });
    }

    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createRequest,
  getRequests,
  updateRequestStatus,
  deleteRequest
};
