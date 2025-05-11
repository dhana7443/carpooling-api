const User = require('../models/User');
const Role = require("../models/Role");
const bcrypt = require('bcrypt');
const generateToken = require("../utils/generateToken");
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

    //4. Hashed Passwords
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

//Resend Otp
exports.resendOTP = async (req, res) => {
  try {
    const { email, phone } = req.body;

    // Validate input
    if (!email && !phone) {
      return res.status(400).json({ message: 'Please provide email or phone to resend OTP' });
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.is_verified === 'verified') return res.status(400).json({ message: 'User already verified' });

    
    // Generate server OTPs
    const emailOtp = generateOTP();
    const phoneOtp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP and expiry
    if (email) {
      user.email_otp =emailOtp;
    }
    if (phone) {
      user.phone_otp = phoneOtp;
    }
    user.otp_expiry = otpExpiry;
    await user.save();

    // Send OTP
    if (email) await sendEmailOTP(email, emailOtp);
    if (phone) await sendPhoneOTP(phone, phoneOtp);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Error in resendOTP:', error);
    res.status(500).json({ message: 'Server error' });
  }
};


//Login User
exports.loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and populate role name
    const user = await User.findOne({ email }).populate("role_id");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.is_verified !== "verified") {
      return res.status(403).json({ message: "User is not verified" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    let dashboard = "";
    if (user.role_id.name === "rider") {
      dashboard = "/rider/dashboard";
    } else if (user.role_id.name === "driver") {
      dashboard = "/driver/dashboard";
    } else if (user.role_id.name === "admin") {
      dashboard = "/admin/dashboard";
    }

    res.status(200).json({
      message: `Login successful as ${user.role_id.name}`,
      dashboard,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role_id.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

//Forgot Password
exports.forgotPassword = async (req, res) => {
  try {
    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ message: 'Please provide email or phone' });
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) return res.status(404).json({ message: 'User not found' });

     // Generate server OTPs
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes


    if (email) {
      user.email_otp = otp;
    }
    if (phone) {
      user.phone_otp = otp;
    }
    user.otp_expiry = otpExpiry;

    await user.save();

    if (email) await sendEmailOTP(email, otp);
    if (phone) await sendPhoneOTP(phone, otp);

    res.status(200).json({ message: 'OTP sent for password reset' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { email, phone, otp, new_password } = req.body;

    if ((!email && !phone) || !otp || !new_password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const user = await User.findOne({ $or: [{ email }, { phone }] });

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.otp_expiry < Date.now()) {
      return res.status(400).json({ message: 'OTP expired' });
    }

    const validOtp = (email && user.email_otp === otp) || (phone && user.phone_otp === otp);

    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    user.password = await bcrypt.hash(new_password, 10);
    user.email_otp = undefined;
    user.phone_otp = undefined;
    user.otp_expiry = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server error' });
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
