const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    enum: ["rider", "driver", "admin"]
  }
});

module.exports = mongoose.model("Role", roleSchema);
