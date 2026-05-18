// ============================================================
// routes/auth.js — Signup, Login, Logout, Me
// ============================================================

const express = require("express");
const router = express.Router();
const User = require("../models/User");

// ─── POST /api/auth/signup ────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered. Please login." });
    }

    // Create and save user (password is hashed by model pre-save hook)
    const user = new User({ name, email, password });
    await user.save();

    // Auto-login after signup: save user id in session
    req.session.userId = user._id;
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ error: "Session error. Please try again." });
      }
      res.json({
        message: "Login successful!",
        user: { id: user._id, name: user.name, email: user.email }
      });
    });

    req.session.userId = user._id;
    req.session.save((err) => {
      if(err){
        return res.status(500).json({error: "Session error. Please try again."});
      }
      res.status(201).json({
        message: "Account created successfully!",
        user: { id: user._id, name: user.name, email: user.email }
   });
  });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/login ─────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    // Save session
    req.session.userId = user._id;

    res.json({
      message: "Login successful!",
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error. Please try again." });
  }
});

// ─── POST /api/auth/logout ────────────────────────────────────
router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ message: "Logged out successfully." });
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────
// Returns currently logged-in user info
router.get("/me", async (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated." });
  }
  try {
    const user = await User.findById(req.session.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustScore: user.trustScore,
        totalPoints: user.totalPoints,
        finalScore: Math.round(user.totalPoints * (user.trustScore / 100)),
        devpostProfile: user.devpostProfile
      }
    });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
