const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Accepted', 'Rejected', 'PickedUp', 'Completed'],
    default: 'Pending'
  },
  message: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
