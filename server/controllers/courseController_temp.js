// @desc    Get all progresses for a course (Admin)
// @route   GET /api/courses/:id/progresses
// @access  Private/Admin
const getCourseProgresses = asyncHandler(async (req, res) => {
    const progresses = await Progress.find({ course: req.params.id })
        .populate('student', 'name email');
    res.status(200).json(progresses);
});
