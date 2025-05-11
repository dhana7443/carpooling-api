// sendTestEmail.js

const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_ID,
    pass: process.env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: process.env.EMAIL_ID,
  to: "o180110@rguktong.ac.in", // use a real email you have access to
  subject: "Test Email from Nodemailer",
  text: "✅ If you're reading this, your email setup is working!",
};

transporter.sendMail(mailOptions, function (error, info) {
  if (error) {
    console.log("❌ Email send error:", error);
  } else {
    console.log("✅ Email sent successfully:", info.response);
  }
});
