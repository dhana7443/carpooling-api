const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth=require('../middleware/auth')

// Register
router.post('/register', userController.registerUser);

//Verify Email and Phone
router.post('/verify', userController.verifyUser);

//Resend Otp
router.post('/resendOtp',userController.resendOTP)

//Login
router.post('/login',userController.loginUser);

//Forgot Password
router.post('/forgot-password',userController.forgotPassword)

//Reset Password
router.post('/reset-password',userController.resetPassword)

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

//Update profile
router.put('/update',auth,userController.updateProfile);

module.exports = router;
