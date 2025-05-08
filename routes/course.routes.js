const express = require('express');
const { searchCourses } = require('../controllers/course.controller.js');

const router = express.Router();

// Search courses
router.get('/search', searchCourses);

module.exports = router;
