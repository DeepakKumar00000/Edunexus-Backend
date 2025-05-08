const express = require('express');
const router = express.Router();

const { dummyEnroll } = require('../controllers/payments');
const { auth, isAdmin, isInstructor, isStudent } = require('../middleware/auth');

router.post('/dummyEnroll', auth, isStudent, dummyEnroll);

module.exports = router
