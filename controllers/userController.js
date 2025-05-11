const User = require('../models/User');
const Role = require("../models/Role");
const bcrypt = require('bcrypt');
const { sendEmailOTP, sendPhoneOTP, generateOTP } = require('../utils/otpService');
const { v4: uuidv4 } = require('uuid');

// Register a user
exports.registerUser = async (req, res) => {
  try {
     const { name, email, phone, password, role_name } = req.body;

     // 1. Check if user already exists
    const existing = await User.findOne({ $or: [{ email }, { phone }] });
    if (existing) return res.status(400).json({ message: "Email or phone already registered." });

    // 2. Find role_id from Role table
    const roleData = await Role.findOne({ name: role_name });
    if (!roleData) return res.status(400).json({ message: "Invalid role." });

    // 3. Generate server OTPs
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes


    // 4. Send OTPs
    await sendEmailOTP(email, emailOtp);
    await sendPhoneOTP(phone, phoneOtp);

    //5. Hashed Passwords
    const hashedPassword = await bcrypt.hash(password, 10);
    
    

    const user = new User({
      user_id: uuidv4(),
      name,
      email,
      phone,
      password: hashedPassword,
      role_id: roleData._id,
      email_otp: emailOtp,
      phone_otp: phoneOtp,
      otp_expiry: otpExpiry,
      is_verified: 'pending',
    });

    await user.save();

    // Send OTPs
    await sendEmailOTP(email, emailOtp);
    await sendPhoneOTP(phone, phoneOtp);

    res.status(201).json({ message: "User registered and verified successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
};

//Verify User
exports.verifyUser = async (req, res) => {
  try {
    const { email, email_otp, phone_otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();

    if (user.otp_expiry < now) {
      await User.deleteOne({ email });
      return res.status(400).json({ message: 'OTP expired. Please register again.' });
    }

    if (user.email_otp === email_otp && user.phone_otp === phone_otp) {
      user.is_verified = 'verified';
      user.email_otp = undefined;
      user.phone_otp = undefined;
      user.otp_expiry = undefined;

      await user.save();
      return res.status(200).json({ message: 'User verified successfully.' });
    } else {
      user.is_verified = 'rejected';
      await user.save();
      await User.deleteOne({ email }); // Delete rejected users
      return res.status(400).json({ message: 'OTP verification failed. Registration rejected.' });
    }
  } catch (err) {
    console.error('Verify Error:', err.message);
    return res.status(500).json({ message: 'Server error' });
  }
};


// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("role_id", "name -_id")  // Replace role_id with name only
      .select("-password");             // Remove password from response

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
