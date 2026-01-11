const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a course title']
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Archived'],
        default: 'Draft'
    },
    lectureStatuses: {
        type: [{
            label: { type: String, required: true },
            color: { type: String, default: '#475569' }
        }],
        default: [
            { label: 'Not Started', color: '#64748b' },
            { label: 'In Progress', color: '#f59e0b' },
            { label: 'Completed', color: '#10b981' }
        ]
    },
    completedStatus: {
        type: String,
        default: 'Completed'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    sections: [{
        title: { type: String, required: true },
        lectures: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Lecture'
        }]
    }]
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for backward compatibility or flat list if needed, 
// but primarily we use sections now.
courseSchema.virtual('totalLectures').get(function () {
    return this.sections.reduce((acc, sec) => acc + sec.lectures.length, 0);
});

module.exports = mongoose.model('Course', courseSchema);
