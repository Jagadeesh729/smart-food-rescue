const express = require('express');
const router = express.Router();
const { createDonation, getDonations, getDonationById } = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../services/uploadService');

router.route('/')
  .post(protect, upload.single('image'), createDonation)
  .get(getDonations);

router.route('/:id')
  .get(getDonationById);

module.exports = router;
