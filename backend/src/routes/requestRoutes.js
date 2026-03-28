const express = require('express');
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus, deleteRequest } = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createRequest)
  .get(protect, getRequests);

router.route('/:id/status')
  .put(protect, updateRequestStatus);

router.route('/:id')
  .delete(protect, deleteRequest);

module.exports = router;
