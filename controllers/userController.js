const User = require('../models/User');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Register a user
exports.registerUser = async (req, res) => {
  try {
    const { email, password, phone_number, gender, role_id } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      user_id: uuidv4(),
      email,
      password: hashedPassword,
      phone_number,
      gender,
      role_id
    });

    await user.save();
    res.status(201).json({ message: 'User registered successfully', user_id: user.user_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single user
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findOne({ user_id: req.params.id }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updates = req.body;
    updates.update_datetime = new Date();

    const user = await User.findOneAndUpdate({ user_id: req.params.id }, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ user_id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
