const Activity = require('../models/Activity');

// @desc    Get all activities (admin only)
// @route   GET /api/activities
// @access  Private/Admin
const getGlobalActivities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;

        const activities = await Activity.find()
            .populate('user', 'name email role')
            .populate('course', 'title')
            .populate('lecture', 'title number')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Activity.countDocuments();

        res.status(200).json({
            activities,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getGlobalActivities
};
