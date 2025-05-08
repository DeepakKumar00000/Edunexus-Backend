const express = require("express")
const router = express.Router()

// Import controllers
const { generateCertificate, getUserCertificates, getCertificateById } = require("../controllers/certificate")

// Import middlewares
const { auth } = require("../middleware/auth")

// Routes
router.post("/generate", auth, generateCertificate)
router.get("/get-all", auth, getUserCertificates)
router.get("/get/:certificateId", getCertificateById)

module.exports = router
