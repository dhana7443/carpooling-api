// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  user_id: {
    type: String,
    unique: true,
    required: true
  },
  name:
  {
    type:String,
    required:true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  profile_picture: {
    type: Buffer // Alternatively, use String if you're storing URL to cloud storage
  },
  phone: {
    type: Number,
    required: true
  },
  is_verified: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  password: {
    type: String,
    required: true
  },
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  email_otp:
   { 
    type: String
   },
  phone_otp: 
  { 
    type: String 
  },
  otp_expiry:
  {
     type: Date
  },
  create_datetime: {
    type: Date,
    default: Date.now
  },
  update_datetime: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
