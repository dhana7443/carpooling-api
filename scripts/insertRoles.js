const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Role = require("../models/Role");

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  await Role.insertMany([
    { name: "rider" },
    { name: "driver" },
    { name: "admin" },
  ]);
  console.log("Roles inserted");
  mongoose.disconnect();
});
