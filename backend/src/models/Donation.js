const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  foodType: {
    type: String,
    enum: ['Cooked', 'Raw', 'Packaged'],
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    enum: ['kg', 'plates', 'boxes', 'liters'],
    required: true
  },
  image: {
    type: String // Cloudinary URL
  },
  expiryTime: {
    type: Date,
    required: true
  },
  location: {
    address: String,
    type: { type: String, enum: ['Point'], default: 'Point' },
    geoCoords: { type: [Number], index: '2dsphere' },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Claimed', 'Expired'],
    default: 'Available'
  }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
