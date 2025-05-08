const crypto = require('crypto');
const mailSender = require('../utils/mailSender');
const { courseEnrollmentEmail } = require('../mail/templates/courseEnrollmentEmail');
require('dotenv').config();

const User = require('../models/user');
const Course = require('../models/course');
const CourseProgress = require("../models/courseProgress");

const { default: mongoose } = require('mongoose');

// ================ Dummy Payment & Enrollment ================
exports.dummyEnroll = async (req, res) => {
    try {
        const { coursesId } = req.body;
        const userId = req.user.id;

        if (!coursesId || coursesId.length === 0) {
            return res.json({ success: false, message: "Please provide Course Id" });
        }

        let enrolledCourses = [];
        for (const course_id of coursesId) {
            let course = await Course.findById(course_id);
            if (!course) {
                return res.status(404).json({ success: false, message: "Could not find the course" });
            }
            const uid = new mongoose.Types.ObjectId(userId);
            if (course.studentsEnrolled.includes(uid)) {
                continue; // Already enrolled
            }
            course.studentsEnrolled.push(uid);
            await course.save();
            enrolledCourses.push(course_id);

            // Create course progress record for this course
            await CourseProgress.create({
                courseID: course_id,
                userId: userId,
                completedVideos: []
            });

            // Send enrollment email (optional)
            try {
                await mailSender(
                    req.user.email,
                    `Successfully Enrolled into ${course.courseName}`,
                    courseEnrollmentEmail(course.courseName, `${req.user.firstName}`)
                );
            } catch (err) {
                // Log but don't block enrollment
                console.error("Error sending enrollment email:", err);
            }
        }

        // Add courses to user's enrolledCourses
        await User.findByIdAndUpdate(userId, {
            $addToSet: { courses: { $each: enrolledCourses } }
        });

        res.json({ success: true, message: "Enrollment successful", enrolledCourses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Enrollment failed" });
    }
};

// ================ (Optional) Keep your other methods if needed ================

// Example: Enrollment email sender (already used above)
exports.sendPaymentSuccessEmail = async (req, res) => {
    try {
        const { orderId, paymentId, amount } = req.body;
        // ...send email logic...
        res.status(200).json({ success: true, message: "Email sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Could not send email" });
    }
};