const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');
const Lecture = require('../models/Lecture');
const User = require('../models/User');
const Progress = require('../models/Progress');
const Activity = require('../models/Activity');

// @desc    Create new course
// @route   POST /api/courses
// @access  Private/Admin
const createCourse = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    const course = await Course.create({
        user: req.user.id,
        title,
        description,
        sections: [],
        lectureStatuses: [
            { label: 'Not Started', color: '#64748b' },
            { label: 'In Progress', color: '#f59e0b' },
            { label: 'Completed', color: '#10b981' }
        ],
        completedStatus: 'Completed'
    });

    res.status(201).json(course);
});

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
const updateCourse = asyncHandler(async (req, res) => {
    const { title, description, status, lectureStatuses } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.status = status || course.status;
    course.lectureStatuses = lectureStatuses !== undefined ? lectureStatuses : course.lectureStatuses;
    course.completedStatus = req.body.completedStatus || course.completedStatus;

    await course.save();
    res.status(200).json(course);
});

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
const getCourses = asyncHandler(async (req, res) => {
    const courses = await Course.find();
    res.status(200).json(courses);
});

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Private
const getCourse = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id)
        .populate({
            path: 'sections.lectures',
            model: 'Lecture'
        });

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    if (!course.lectureStatuses || course.lectureStatuses.length === 0) {
        course.lectureStatuses = [
            { label: 'Not Started', color: '#64748b' },
            { label: 'In Progress', color: '#f59e0b' },
            { label: 'Completed', color: '#10b981' }
        ];
    }

    res.status(200).json(course);
});

// @desc    Add section to course
// @route   POST /api/courses/:id/sections
// @access  Private/Admin
const addSection = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    course.sections.push({ title, lectures: [] });
    await course.save();

    res.status(201).json(course);
});

// @desc    Update section
// @route   PUT /api/courses/:id/sections/:sectionId
// @access  Private/Admin
const updateSection = asyncHandler(async (req, res) => {
    const { title } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
        res.status(404);
        throw new Error('Section not found');
    }

    section.title = title || section.title;
    await course.save();

    res.status(200).json(course);
});

// @desc    Delete section
// @route   DELETE /api/courses/:id/sections/:sectionId
// @access  Private/Admin
const deleteSection = asyncHandler(async (req, res) => {
    const course = await Course.findById(req.params.id);

    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const section = course.sections.id(req.params.sectionId);
    if (!section) {
        res.status(404);
        throw new Error('Section not found');
    }

    // Delete all lectures in this section
    if (section.lectures && section.lectures.length > 0) {
        await Lecture.deleteMany({ _id: { $in: section.lectures } });
    }

    // Remove section from course (using pull or just modify array)
    // Mongoose Subdocs:
    course.sections.pull(req.params.sectionId);
    await course.save();

    res.status(200).json({ id: req.params.sectionId });
});

// @desc    Add lecture to course section
// @route   POST /api/courses/:id/sections/:sectionId/lectures
// @access  Private/Admin
const addLectureToSection = asyncHandler(async (req, res) => {
    const { title, number, resourceUrl, description, dueDate } = req.body;
    const { id, sectionId } = req.params;

    const course = await Course.findById(id);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const section = course.sections.id(sectionId);
    if (!section) {
        res.status(404);
        throw new Error('Section not found');
    }

    // Create Lecture
    const lecture = await Lecture.create({
        course: id,
        title,
        number,
        resourceUrl,
        description,
        dueDate,
        status: req.body.status || 'Pending'
    });

    // Add to section
    section.lectures.push(lecture._id);
    await course.save();

    res.status(201).json(lecture);
});

// @desc    Update lecture
// @route   PUT /api/courses/lectures/:id
// @access  Private/Admin
const updateLecture = asyncHandler(async (req, res) => {
    const { title, resourceUrl, description, dueDate } = req.body;

    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
        res.status(404);
        throw new Error('Lecture not found');
    }

    lecture.title = title || lecture.title;
    lecture.resourceUrl = resourceUrl || lecture.resourceUrl;
    lecture.description = description || lecture.description;
    lecture.dueDate = dueDate || lecture.dueDate;
    lecture.status = req.body.status || lecture.status;

    await lecture.save();
    res.status(200).json(lecture);
});

// @desc    Delete lecture
// @route   DELETE /api/courses/lectures/:id
// @access  Private/Admin
const deleteLecture = asyncHandler(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
        res.status(404);
        throw new Error('Lecture not found');
    }

    // Remove from Course/Section
    // We need to find the course and section that contains this lecture
    // Since Lecture has `course` ref, we can find it.
    // However, Section is inside Course.sections array.

    const course = await Course.findById(lecture.course);
    if (course) {
        // Find which section has this lecture
        course.sections.forEach(section => {
            const idx = section.lectures.indexOf(lecture._id);
            if (idx > -1) {
                section.lectures.splice(idx, 1);
            }
        });
        await course.save();
    }

    // Delete the lecture document
    await lecture.deleteOne();

    // Optional: Clean up Progress/Activity if strictly required, 
    // but often keeping logs is fine or handled by separate cleanup jobs.
    // For now, let's leave logs as 'orphaned' history or delete them.
    // User didn't specify, so keeping it simple.

    res.status(200).json({ id: req.params.id });
});

// @desc    Enroll student in course
// @route   POST /api/courses/:id/enroll
// @access  Private/Admin
const enrollStudent = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const courseId = req.params.id;

    const user = await User.findOne({ email });
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const course = await Course.findById(courseId);
    if (!course) {
        res.status(404);
        throw new Error('Course not found');
    }

    const progressExists = await Progress.findOne({ student: user._id, course: courseId });
    if (progressExists) {
        res.status(400);
        throw new Error('Student already enrolled');
    }

    const progress = await Progress.create({
        student: user._id,
        course: courseId,
        completedLectures: []
    });

    res.status(201).json(progress);

    // Log Activity
    await Activity.create({
        student: user._id,
        course: courseId,
        action: 'Enrolled',
        details: `Enrolled in ${course.title}`
    });
});

// @desc    Get enrolled courses for current user
// @route   GET /api/courses/my/enrolled
// @access  Private
const getEnrolledCourses = asyncHandler(async (req, res) => {
    const progresses = await Progress.find({ student: req.user.id })
        .populate({
            path: 'course',
            populate: {
                path: 'sections.lectures',
                model: 'Lecture'
            }
        });

    // Only show Published courses to students (hide Draft and Archived)
    const publishedProgresses = progresses.filter(progress =>
        progress.course && progress.course.status === 'Published'
    );

    res.status(200).json(publishedProgresses);
});

// @desc    Get single lecture
// @route   GET /api/courses/lectures/:id
// @access  Private
const getLecture = asyncHandler(async (req, res) => {
    const lecture = await Lecture.findById(req.params.id);
    if (!lecture) {
        res.status(404);
        throw new Error('Lecture not found');
    }
    res.status(200).json(lecture);
});

// @desc    Update lecture progress
// @route   PUT /api/courses/lectures/:id/progress
// @access  Private
const updateLectureProgress = asyncHandler(async (req, res) => {
    const lectureId = req.params.id;
    const { status, notes, courseId } = req.body;

    let targetCourseId;
    let lectureTitle = 'Unknown Lecture';

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        res.status(404);
        throw new Error('Lecture not found');
    }
    targetCourseId = lecture.course;
    lectureTitle = lecture.title;

    let progress = await Progress.findOne({ student: req.user.id, course: targetCourseId });

    if (!progress) {
        res.status(404);
        throw new Error('Not enrolled in this course');
    }

    const lectureIndex = progress.completedLectures.findIndex(
        (item) => item.lecture.toString() === lectureId
    );

    if (lectureIndex > -1) {
        progress.completedLectures[lectureIndex].status = status || progress.completedLectures[lectureIndex].status;
        progress.completedLectures[lectureIndex].notes = notes !== undefined ? notes : progress.completedLectures[lectureIndex].notes;
        progress.completedLectures[lectureIndex].completedAt = Date.now();
    } else {
        progress.completedLectures.push({
            lecture: lectureId,
            status,
            notes,
            completedAt: Date.now()
        });
    }

    await progress.save();

    // Log Activity if status changed or notes updated
    if (status) {
        const course = await Course.findById(targetCourseId);
        const completionLabel = course?.completedStatus || 'Completed';

        await Activity.create({
            student: req.user.id,
            course: targetCourseId,
            lecture: lectureId,
            action: status === completionLabel ? 'Completed' : 'In Progress',
            details: `Updated status to ${status} for ${lectureTitle}`
        });
    }

    if (notes !== undefined) {
        await Activity.create({
            student: req.user.id,
            course: targetCourseId,
            lecture: lectureId,
            action: 'Note Updated',
            details: `Updated notes for ${lectureTitle}: "${notes.substring(0, 50)}${notes.length > 50 ? '...' : ''}"`
        });
    }

    res.status(200).json(progress);
});

// @desc    Add a comment to a lecture
// @route   POST /api/courses/lectures/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
    const lectureId = req.params.id;
    const { content, courseId } = req.body;

    // Use Activity to store comments
    const activity = await Activity.create({
        student: req.user.id,
        course: courseId,
        lecture: lectureId,
        action: 'Comment',
        details: content
    });

    res.status(201).json(activity);
});

// @desc    Get comments for a lecture (Current User)
// @route   GET /api/courses/lectures/:id/comments
// @access  Private
const getLectureComments = asyncHandler(async (req, res) => {
    const comments = await Activity.find({
        lecture: req.params.id,
        action: 'Comment'
    })
        .populate('student', 'name email')
        .sort({ createdAt: -1 }); // Newest first
    res.status(200).json(comments);
});

// @desc    Get student activity for a course
// @route   GET /api/courses/:id/activity/:studentId
// @access  Private/Admin
const getStudentActivity = asyncHandler(async (req, res) => {
    const { id, studentId } = req.params;
    const activities = await Activity.find({ course: id, student: studentId })
        .populate('lecture', 'title number')
        .sort({ createdAt: -1 });
    res.status(200).json(activities);
});

// @desc    Get all progresses for a course (Admin)
// @route   GET /api/courses/:id/progresses
// @access  Private/Admin
const getCourseProgresses = asyncHandler(async (req, res) => {
    const progresses = await Progress.find({ course: req.params.id })
        .populate('student', 'name email');
    res.status(200).json(progresses);
});

// @desc    Get user stats (completed lectures count)
// @route   GET /api/courses/my/stats
// @access  Private
const getUserStats = asyncHandler(async (req, res) => {
    // 1. Total Completed Lectures (from Progress)
    const progresses = await Progress.find({ student: req.user.id });
    let totalCompletedLectures = 0;
    progresses.forEach(p => {
        if (p.completedLectures) {
            totalCompletedLectures += p.completedLectures.filter(l => l.status === 'Completed').length;
        }
    });

    // 2. Daily Activity & Streaks (from Activity Logs)
    // We only care about 'Completed' actions for streaks/consistency
    const activities = await Activity.find({
        student: req.user.id,
        action: 'Completed'
    }).sort({ createdAt: 1 });

    // Group by Date (YYYY-MM-DD) and count unique lectures
    const activityMap = {}; // { '2023-10-25': Set { lectureId1, lectureId2 } }
    activities.forEach(act => {
        if (!act.lecture) return;
        const dateStr = act.createdAt.toISOString().split('T')[0];
        if (!activityMap[dateStr]) {
            activityMap[dateStr] = new Set();
        }
        activityMap[dateStr].add(act.lecture.toString());
    });

    // Convert Sets to counts for the frontend
    const finalActivityMap = {};
    Object.keys(activityMap).forEach(date => {
        finalActivityMap[date] = activityMap[date].size;
    });

    const dates = Object.keys(finalActivityMap).sort();

    let currentStreak = 0;
    let maxStreak = 0;

    if (dates.length > 0) {
        // Calculate Max Streak
        let tempStreak = 1;
        maxStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const prevDate = new Date(dates[i - 1]);
            const currDate = new Date(dates[i]);
            const diffTime = Math.abs(currDate - prevDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                tempStreak++;
            } else {
                tempStreak = 1;
            }
            if (tempStreak > maxStreak) maxStreak = tempStreak;
        }

        // Calculate Current Streak
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        const lastActiveDate = dates[dates.length - 1];

        if (lastActiveDate === today || lastActiveDate === yesterday) {
            // Traverse backwards from lastActiveDate to find streak
            let streak = 1;
            for (let i = dates.length - 1; i > 0; i--) {
                const prevDate = new Date(dates[i - 1]);
                const currDate = new Date(dates[i]);
                const diffTime = Math.abs(currDate - prevDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    streak++;
                } else {
                    break;
                }
            }
            currentStreak = streak;
        } else {
            currentStreak = 0;
        }
    }

    res.status(200).json({
        totalCompletedLectures,
        currentStreak,
        maxStreak,
        dailyActivity: finalActivityMap
    });
});

module.exports = {
    createCourse,
    updateCourse,
    getCourses,
    getCourse,
    getCourse,
    addSection,
    updateSection,
    deleteSection,
    addLectureToSection,
    enrollStudent,
    getEnrolledCourses,
    updateLectureProgress,
    getStudentActivity,
    getCourseProgresses,
    addComment,
    getLectureComments,
    updateLecture,
    deleteLecture,
    getLecture,
    getUserStats
};
