const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { getGlobalActivities } = require('../controllers/activityController');

router.get('/', protect, admin, getGlobalActivities);

module.exports = router;
