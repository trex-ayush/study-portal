const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Course'
    },
    lecture: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lecture'
    },
    action: {
        type: String,
        required: true,
        enum: ['Started', 'In Progress', 'Completed', 'Note Updated', 'Enrolled', 'Comment']
    },
    details: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
