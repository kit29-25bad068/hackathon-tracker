// ============================================================
// routes/projects.js — Add, list projects + leaderboard
// ============================================================

const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");
const Project = require("../models/Project");
const { updateTrustScore } = require("../utils/trustScore");
const { validateProofWithOCR } = require("../utils/ocrValidation");

// ─── Multer setup: save uploads to /backend/uploads/ ─────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads");
    // Create folder if it doesn't exist
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Give unique name: timestamp + original name
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (jpeg, png, gif, webp)"), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

// ─── Middleware: require login ────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please login first." });
  }
  next();
}

// ─── Points map ──────────────────────────────────────────────
const POINTS = { registered: 5, participated: 20, winner: 50 };

// ─── POST /api/add-project ────────────────────────────────────
// For manual Unstop submissions with proof image
router.post("/add-project", requireAuth, upload.single("proofImage"), async (req, res) => {
  try {
    const { hackathonName, link, status } = req.body;
    const userId = req.session.userId;

    // Validate required fields
    if (!hackathonName || !status) {
      return res.status(400).json({ error: "Hackathon name and status are required." });
    }
    if (!POINTS[status]) {
      return res.status(400).json({ error: "Status must be: registered, participated, or winner." });
    }

    // Build project object
    const projectData = {
      userId,
      source: "unstop",
      hackathonName: hackathonName.trim(),
      link: link || "",
      status,
      points: POINTS[status]
    };

    // If image was uploaded, run OCR validation
    let ocrResult = { validated: false, text: "", note: "No proof uploaded" };

    if (req.file) {
      projectData.proofImage = req.file.filename;
      console.log(`🔍 Running OCR on: ${req.file.path}`);

      // OCR can be slow — we handle errors gracefully
      try {
        ocrResult = await validateProofWithOCR(req.file.path, hackathonName);
      } catch (ocrErr) {
        console.error("OCR error (non-fatal):", ocrErr.message);
        ocrResult = { validated: false, text: "", note: "OCR processing failed — manual review needed" };
      }

      projectData.ocrText = ocrResult.text;
      projectData.proofValidated = ocrResult.validated;
      projectData.validationNote = ocrResult.note;
    }

    // Save project
    const project = new Project(projectData);
    await project.save();

    // Update user's total points
    await User.findByIdAndUpdate(userId, { $inc: { totalPoints: POINTS[status] } });

    // Update trust score based on validation result
    await updateTrustScore(userId, {
      hasProof: !!req.file,
      proofValidated: ocrResult.validated,
      hasLink: !!link
    });

    res.status(201).json({
      message: "Project added successfully!",
      project,
      validation: ocrResult
    });

  } catch (err) {
    console.error("Add project error:", err);
    res.status(500).json({ error: err.message || "Server error." });
  }
});

// ─── GET /api/projects ────────────────────────────────────────
// Returns all projects for the logged-in user
router.get("/projects", requireAuth, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.session.userId })
      .sort({ submittedAt: -1 }); // Newest first
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── GET /api/leaderboard ─────────────────────────────────────
// Returns all users sorted by final score
router.get("/leaderboard", async (req, res) => {
  try {
    const users = await User.find({}, "name email trustScore totalPoints createdAt");

    // Calculate final score for each user and sort
    const leaderboard = users
      .map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        trustScore: u.trustScore,
        totalPoints: u.totalPoints,
        // FINAL_SCORE = points × (trustScore / 100)
        finalScore: Math.round(u.totalPoints * (u.trustScore / 100))
      }))
      .sort((a, b) => b.finalScore - a.finalScore); // Descending

    res.json({ leaderboard });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

// ─── GET /api/projects/all ────────────────────────────────────
// Returns all projects for a specific user (used in dashboard)
router.get("/projects/user/:userId", async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.params.userId })
      .sort({ submittedAt: -1 });
    res.json({ projects });
  } catch (err) {
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
