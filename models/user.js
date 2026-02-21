const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },

    // ✅ MVP profile fields
    fullName: { type: String, default: "" },
    dob: { type: String, default: "" }, // store ISO string for MVP
    gender: { type: String, default: "" },
    lookingFor: { type: String, default: "" },

    // ✅ photos list (URLs)
    photos: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);