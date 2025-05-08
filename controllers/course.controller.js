const Course = require('../models/course.js');

// Search courses
const searchCourses = async (req, res) => {
    try {
        const { q } = req.query;
        console.log('Search term received:', q);
        if (!q || q.trim() === '') {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const courses = await Course.find({
            $or: [
                { courseName: new RegExp(q, 'i') },
                { courseDescription: new RegExp(q, 'i') },
                { tag: { $in: [new RegExp(q, 'i')] } }
            ]
        }).select('courseName thumbnail instructor price slug').populate('instructor', 'firstName lastName').limit(10);

        if (courses.length === 0) {
            return res.status(404).json({ message: 'No courses found' });
        }

        res.status(200).json(courses);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching courses' });
    }
};

module.exports = { searchCourses };
