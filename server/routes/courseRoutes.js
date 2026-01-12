const express = require('express');
const router = express.Router();
const {
    createCourse,
    updateCourse,
    deleteCourse,
    getCourses,
    getCourse,
    addSection,
    updateSection,
    deleteSection,
    addLectureToSection,
    enrollStudent,
    getEnrolledCourses,
    getCreatedCourses,
    updateLectureProgress,
    getStudentActivity,
    getCourseProgresses,
    addComment,
    getLectureComments,
    updateLecture,
    deleteLecture,
    getLecture,
    getUserStats,
    removeStudent
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');
const { verifyCourseOwnership, verifyLectureOwnership } = require('../middleware/ownershipMiddleware');

// Student routes (any authenticated user)
router.get('/', protect, getCourses);
router.get('/my/enrolled', protect, getEnrolledCourses);
router.get('/my/created', protect, getCreatedCourses);
router.get('/my/stats', protect, getUserStats);
router.get('/:id', protect, getCourse);
router.put('/lectures/:id/progress', protect, updateLectureProgress);
router.post('/lectures/:id/comments', protect, addComment);
router.get('/lectures/:id/comments', protect, getLectureComments);
router.get('/lectures/:id', protect, getLecture);

// Course owner routes (admin OR course owner)
router.post('/', protect, createCourse);
router.put('/:id', protect, verifyCourseOwnership, updateCourse);
router.delete('/:id', protect, verifyCourseOwnership, deleteCourse);
router.post('/:id/sections', protect, verifyCourseOwnership, addSection);
router.put('/:id/sections/:sectionId', protect, verifyCourseOwnership, updateSection);
router.delete('/:id/sections/:sectionId', protect, verifyCourseOwnership, deleteSection);
router.post('/:id/sections/:sectionId/lectures', protect, verifyCourseOwnership, addLectureToSection);
router.post('/:id/enroll', protect, verifyCourseOwnership, enrollStudent);
router.get('/:id/activity/:studentId', protect, verifyCourseOwnership, getStudentActivity);
router.get('/:id/progresses', protect, verifyCourseOwnership, getCourseProgresses);
router.delete('/:id/enroll/:studentId', protect, verifyCourseOwnership, removeStudent);

// Lecture owner routes (admin OR owner of course containing lecture)
router.put('/lectures/:id', protect, verifyLectureOwnership, updateLecture);
router.delete('/lectures/:id', protect, verifyLectureOwnership, deleteLecture);

module.exports = router;
