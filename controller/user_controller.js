const User = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * SIGNUP
 */
const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.username,
        email: newUser.email
      }
    });
  } catch (e) {
    console.log("Signup error:", e);
    res.status(500).json({ message: "Unable to signup" });
  }
};

/**
 * LOGIN
 */
const login = async (req, res) => {
  try {
    console.log("Login request body:", req.body);
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.username,
        email: user.email
      }
    });
  } catch (e) {
    console.error("Login error:", e);
    res.status(500).json({ message: "Unable to login" });
  }
};

/**
 * GET ALL USERS (optional)
 */
const findAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (e) {
    console.error("Unable to find users:", e);
    res.status(500).json({ message: "Unable to fetch users" });
  }
};

module.exports = {
  signup,
  login,
  findAllUsers
};
