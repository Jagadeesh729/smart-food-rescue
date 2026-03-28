const express = require('express');
const router = express.Router();
const { createDonation, getDonations, getDonationById, getMyDonations } = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../services/uploadService');

router.route('/')
  .post(protect, upload.single('image'), createDonation)
  .get(getDonations);

router.get('/my', protect, getMyDonations);

router.route('/:id')
  .get(getDonationById);

module.exports = router;
