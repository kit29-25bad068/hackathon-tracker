// ============================================================
// models/User.js — MongoDB schema for users
// ============================================================

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema({
  // Basic auth fields
  name: {
    type: String,
    required: [true, "Name is required"],
    trim: true
  },
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: 6
  },

  // Devpost integration
  devpostProfile: {
    type: String,
    default: ""   // e.g. "https://devpost.com/johndoe"
  },

  // Trust score (0–100). Starts at 50 for new users.
  trustScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100
  },

  // Total raw points (before trust multiplier)
  totalPoints: {
    type: Number,
    default: 0
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ─── Hash password before saving ─────────────────────────────
UserSchema.pre("save", async function (next) {
  // Only hash if the password field was changed
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Method: compare plain password with hashed ──────────────
UserSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};

// ─── Virtual: computed final score ───────────────────────────
// FINAL_SCORE = totalPoints × (trustScore / 100)
UserSchema.virtual("finalScore").get(function () {
  return Math.round(this.totalPoints * (this.trustScore / 100));
});

module.exports = mongoose.model("User", UserSchema);
