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
