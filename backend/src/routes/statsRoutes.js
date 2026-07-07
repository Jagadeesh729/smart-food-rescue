const express = require('express');
const router = express.Router();
const { getDashboardStats, getPublicStats } = require('../controllers/statsController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoint — no auth required (for home page stats)
router.get('/public', getPublicStats);

// Private dashboard stats
router.get('/', protect, getDashboardStats);

module.exports = router;
