// backedNodeBlik/controller/user_controller.js
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

function signToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || "secretkey",
    { expiresIn: "1d" }
  );
}

function userPayload(user) {
  return {
    id: user._id,
    username: user.username,
    email: user.email,
  };
}

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();

    const token = signToken(newUser._id);

    return res.status(201).json({
      message: "User registered successfully",
      token,
      user: userPayload(newUser),
    });
  } catch (e) {
    console.log("Signup error:", e);
    return res.status(500).json({ message: "Unable to signup" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const token = signToken(user._id);

    return res.status(200).json({
      message: "Login successful",
      token,
      user: userPayload(user),
    });
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ message: "Unable to login" });
  }
};

const findAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json(users);
  } catch (e) {
    console.error("Unable to find users:", e);
    return res.status(500).json({ message: "Unable to fetch users" });
  }
};

module.exports = { signup, login, findAllUsers };