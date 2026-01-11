const Activity = require('../models/Activity');

const activityLogger = async (req, res, next) => {
    // We use 'finish' to ensure we capture the outcome and any user set during the request (e.g. Login)
    res.on('finish', async () => {
        try {
            // 1. Only log state-changing methods
            if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
                return;
            }

            // 2. Identify User
            // check req.user (from protect middleware) OR res.locals.user (from authController)
            const user = req.user || res.locals.user;
            if (!user) return; // Don't log anonymous actions

            const userId = user._id || user.id;

            // 3. Prepare Event Data (Body)
            let eventData = { ...req.body };

            // Sanitize sensitive fields
            if (eventData.password) delete eventData.password;
            if (eventData.token) delete eventData.token;

            const url = req.originalUrl;

            // 4. Determine Action Context (heuristic)
            let action = '';
            let details = '';
            // Auth
            if (url.includes('/login')) action = 'Login';
            if (url.includes('/register')) action = 'Registered';

            // Courses
            if (url.includes('/enroll')) action = 'Enrolled';
            if (url.includes('/comments')) action = 'Comment';

            // 5. Construct Log
            const logData = {
                user: userId,
                action: action || req.method, // Uses specific or fallback to Method
                method: req.method,           // ALWAYS save method
                url: req.originalUrl,
                data: eventData,
                details: details || `Request to ${req.originalUrl}`
            };

            // Link to Course
            const courseId = req.body.courseId || req.body.course || (res.locals.course ? res.locals.course._id : undefined);
            if (courseId) logData.course = courseId;

            // Override from Controller
            if (res.locals.activity) {
                if (res.locals.activity.skip) return;
                if (res.locals.activity.action) logData.action = res.locals.activity.action; // Controller Specifics (e.g. Note Updated)
                if (res.locals.activity.details) logData.details = res.locals.activity.details;
                if (res.locals.activity.course) logData.course = res.locals.activity.course;
            }

            await Activity.create(logData);

        } catch (err) {
            console.error('Activity Logger Error:', err.message);
        }
    });

    next();
};

module.exports = activityLogger;
