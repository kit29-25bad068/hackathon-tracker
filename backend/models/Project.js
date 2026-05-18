// ============================================================
// models/Project.js — MongoDB schema for hackathon submissions
// ============================================================

const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema({
  // Which user submitted this
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  // Source: either "devpost" (auto-scraped) or "unstop" (manual)
  source: {
    type: String,
    enum: ["devpost", "unstop"],
    required: true
  },

  // ─── Common Fields ───────────────────────────────────────
  hackathonName: {
    type: String,
    required: true,
    trim: true
  },
  projectTitle: {
    type: String,
    trim: true,
    default: ""
  },
  link: {
    type: String,
    trim: true,
    default: ""
  },

  // ─── Unstop-specific Fields ───────────────────────────────
  // Status of participation
  status: {
    type: String,
    enum: ["registered", "participated", "winner"],
    default: "participated"
  },

  // Path to uploaded proof image
  proofImage: {
    type: String,
    default: ""
  },

  // OCR extracted text from the proof image
  ocrText: {
    type: String,
    default: ""
  },

  // Whether the proof passed validation
  proofValidated: {
    type: Boolean,
    default: false
  },

  // Reason if validation failed
  validationNote: {
    type: String,
    default: ""
  },

  // ─── Points ──────────────────────────────────────────────
  // registered=5, participated=20, winner=50
  points: {
    type: Number,
    default: 0
  },

  // Timestamp
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Project", ProjectSchema);
