const express = require('express');
const router = express.Router();
const {
    createCourse,
    getCourses,
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
} = require('../controllers/courseController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public/Student routes
router.get('/', protect, getCourses);
router.get('/my/enrolled', protect, getEnrolledCourses);
router.get('/my/stats', protect, getUserStats);
router.get('/:id', protect, getCourse);
router.put('/lectures/:id/progress', protect, updateLectureProgress);
router.post('/lectures/:id/comments', protect, addComment);
router.get('/lectures/:id/comments', protect, getLectureComments);
router.get('/lectures/:id', protect, getLecture);
router.put('/lectures/:id', protect, admin, updateLecture);
router.delete('/lectures/:id', protect, admin, deleteLecture);

// Admin routes
router.post('/', protect, admin, createCourse);
router.post('/:id/sections', protect, admin, addSection);
router.put('/:id/sections/:sectionId', protect, admin, updateSection);
router.delete('/:id/sections/:sectionId', protect, admin, deleteSection);
router.post('/:id/sections/:sectionId/lectures', protect, admin, addLectureToSection);
router.post('/:id/enroll', protect, admin, enrollStudent);
router.get('/:id/activity/:studentId', protect, admin, getStudentActivity);
router.get('/:id/progresses', protect, admin, getCourseProgresses);

module.exports = router;
