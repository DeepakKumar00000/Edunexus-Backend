const User = require('../models/user');
const mailSender = require('../utils/mailSender');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

// ================ resetPasswordToken ================
exports.resetPasswordToken = async (req, res) => {
    try {
        console.log('Reset password token request received:', {
            email: req.body?.email
        });
        // extract email 
        const { email } = req.body;

        // email validation
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Your Email is not registered with us'
            });
        }

        // generate token
        const token = crypto.randomBytes(20).toString("hex");

        // update user by adding token & token expire date
        const updatedUser = await User.findOneAndUpdate(
            { email: email },
            { token: token, resetPasswordTokenExpires: Date.now() + 5 * 60 * 1000 },
            { new: true }); // by marking true, it will return updated user


        // create url
        const url = `http://localhost:5173/update-password/${token}`;

        // send email containing url
        await mailSender(email, 'Password Reset Link', `Password Reset Link : ${url}`);

        // return succes response
        res.status(200).json({
            success: true,
            message: 'Email sent successfully , Please check your mail box and change password'
        })
    }

    catch (error) {
        console.log('RESET PASSWORD TOKEN ERROR DETAILS:', {
            email: req.body?.email,
            errorMessage: error.message,
            errorStack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while creating token for reset password'
        })
    }
}



// ================ resetPassword ================
exports.resetPassword = async (req, res) => {
    try {
        console.log('Reset password request received:', {
            token: req.body?.token,
            password: req.body?.password,
            confirmPassword: req.body?.confirmPassword
        });
        // extract data
        // extract token by anyone from this 3 ways
        const token = req.body?.token || req.cookies?.token || req.header('Authorization')?.replace('Bearer ', '');

        console.log('Token received:', token);

        const { password, confirmPassword } = req.body;

        // validation
        if (!token || !password || !confirmPassword) {
            console.log('Validation failed - missing fields');
            return res.status(401).json({
                success: false,
                message: "All fields are required...!"
            });
        }

        // validate both passwords
        if (password !== confirmPassword) {
            console.log('Validation failed - passwords do not match');
            return res.status(401).json({
                success: false,
                message: 'Passwords are not matched'
            });
        }


        // find user by token from DB
        console.log('Searching for user with token:', token);
        const userDetails = await User.findOne({ token: token });
        console.log('User details found:', userDetails);

        if (!userDetails) {
            console.log('Validation failed - invalid token');
            return res.status(404).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.log('Checking token match');
        if (token !== userDetails.token) {
            console.log('Validation failed - token mismatch');
            return res.status(401).json({
                success: false,
                message: 'Password Reset token is not matched'
            });
        }

        console.log('Checking token expiration');
        if (!(userDetails.resetPasswordTokenExpires > Date.now())) {
            console.log('Validation failed - token expired');
            return res.status(401).json({
                success: false,
                message: 'Token is expired, please regenerate token'
            });
        }


        // hash new passoword
        const hashedPassword = await bcrypt.hash(password, 10);

        // update user with New Password
        await User.findOneAndUpdate(
            { token },
            { password: hashedPassword },
            { new: true });

        res.status(200).json({
            success: true,
            message: 'Password reset successfully'
        });
    }

    catch (error) {
        console.log('RESET PASSWORD ERROR DETAILS:', {
            token: req.body?.token,
            password: req.body?.password,
            confirmPassword: req.body?.confirmPassword,
            errorMessage: error.message,
            errorStack: error.stack
        });
        res.status(500).json({
            success: false,
            error: error.message,
            message: 'Error while resetting password'
        });
    }
}