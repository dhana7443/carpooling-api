const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Register
router.post('/register', userController.registerUser);

//Verify Email and Phone
router.post('/verify', userController.verifyUser);

// Get all users
router.get('/', userController.getAllUsers);

// Get user by ID
router.get('/:id', userController.getUserById);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
