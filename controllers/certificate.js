const Certificate = require("../models/certificate")
const CourseProgress = require("../models/courseProgress")
const Course = require("../models/course")
const User = require("../models/user")
const { v4: uuidv4 } = require('uuid')

// Generate a certificate for a completed course
exports.generateCertificate = async (req, res) => {
    try {
        const { courseId } = req.body
        const userId = req.user.id

        if (!courseId) {
            return res.status(400).json({
                success: false,
                message: "Course ID is required"
            })
        }

        // Check if the course exists
        const course = await Course.findById(courseId)
            .populate({
                path: "courseContent",
                populate: {
                    path: "subSection",
                }
            })

        if (!course) {
            return res.status(404).json({
                success: false,
                message: "Course not found"
            })
        }

        // Check if the user is enrolled in the course
        const userEnrolled = await User.findOne({
            _id: userId,
            courses: { $elemMatch: { $eq: courseId } }
        })

        if (!userEnrolled) {
            return res.status(400).json({
                success: false,
                message: "User is not enrolled in this course"
            })
        }

        // Calculate total subsections in the course
        let totalSubsections = 0
        course.courseContent.forEach(section => {
            totalSubsections += section.subSection.length
        })

        // Get the course progress
        const courseProgress = await CourseProgress.findOne({
            courseID: courseId,
            userId: userId
        })

        if (!courseProgress) {
            return res.status(404).json({
                success: false,
                message: "Course progress not found"
            })
        }

        // Calculate completion percentage
        const completedVideos = courseProgress.completedVideos.length
        const progressPercentage = (completedVideos / totalSubsections) * 100

        // Check if the course is completed (100% or close to it)
        if (progressPercentage < 100) {
            return res.status(400).json({
                success: false,
                message: "Course not completed yet",
                progressPercentage
            })
        }

        // Check if certificate already exists
        let certificate = await Certificate.findOne({
            courseID: courseId,
            userId: userId
        })

        // If certificate doesn't exist, create a new one
        if (!certificate) {
            certificate = await Certificate.create({
                courseID: courseId,
                userId: userId,
                certificateId: uuidv4(),
                issueDate: new Date()
            })
        }

        // Return the certificate details
        return res.status(200).json({
            success: true,
            message: "Certificate generated successfully",
            certificate
        })
    } catch (error) {
        console.error("Error generating certificate:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to generate certificate",
            error: error.message
        })
    }
}

// Get all certificates for a user
exports.getUserCertificates = async (req, res) => {
    try {
        const userId = req.user.id

        // Find all certificates for the user
        const certificates = await Certificate.find({ userId })
            .populate({
                path: "courseID",
                select: "courseName thumbnail"
            })
            .populate({
                path: "userId",
                select: "firstName lastName email"
            })
            .sort({ issueDate: -1 })

        return res.status(200).json({
            success: true,
            data: certificates
        })
    } catch (error) {
        console.error("Error fetching certificates:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to fetch certificates",
            error: error.message
        })
    }
}

// Get a specific certificate by ID
exports.getCertificateById = async (req, res) => {
    try {
        const { certificateId } = req.params

        // Find the certificate
        const certificate = await Certificate.findOne({ certificateId })
            .populate({
                path: "courseID",
                select: "courseName thumbnail"
            })
            .populate({
                path: "userId",
                select: "firstName lastName email"
            })

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: "Certificate not found"
            })
        }

        return res.status(200).json({
            success: true,
            data: certificate
        })
    } catch (error) {
        console.error("Error fetching certificate:", error)
        return res.status(500).json({
            success: false,
            message: "Failed to fetch certificate",
            error: error.message
        })
    }
}
