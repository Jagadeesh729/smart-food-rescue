const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Donor', 'NGO', 'Admin'],
    required: true
  },
  phone: {
    type: String
  },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
