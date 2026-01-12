const express = require('express');
const dotenv = require('dotenv').config();
const { errorHandler } = require('./middleware/errorMiddleware');
const activityLogger = require('./middleware/activityLogger');
const connectDB = require('./config/db');
const cors = require('cors');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Activity Logger - Tracks non-GET requests
app.use(activityLogger);

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/courses', require('./routes/courseRoutes'));
app.use('/api/broadcasts', require('./routes/broadcastRoutes'));
app.use('/api/activities', require('./routes/activityRoutes'));

// Error handler middleware - need to create this file too
app.use((err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

app.listen(port, () => console.log(`Server started on port ${port}`));
