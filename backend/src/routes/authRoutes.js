const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyOTP, resendOTP, checkEmail, getUserProfile, googleLogin, testSMTP } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/google', googleLogin);
router.get('/check-email', checkEmail);
router.get('/test-smtp', testSMTP);
router.get('/profile', protect, getUserProfile);

module.exports = router;
