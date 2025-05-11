// utils/otpService.js

const nodemailer = require('nodemailer');
const twilio = require('twilio');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendEmailOTP = async (email, otp) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_ID,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_ID,
    to: email,
    subject: "Email OTP Verification",
    text: `Your OTP is: ${otp}`,
  });
};

const sendPhoneOTP = async (phone, otp) => {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

  await client.messages.create({
    body: `Your OTP is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
};

module.exports = { generateOTP, sendEmailOTP, sendPhoneOTP };
