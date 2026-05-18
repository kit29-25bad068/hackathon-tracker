// ============================================================
// routes/devpost.js — Add Devpost profile + manual fetch
// ============================================================

const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { fetchAndSaveDevpostProjects } = require("../scraper/devpostScraper");

// ─── Middleware: require login ────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Please login first." });
  }
  next();
}

// ─── POST /api/add-devpost-profile ───────────────────────────
// Save the user's Devpost profile URL
router.post("/add-devpost-profile", requireAuth, async (req, res) => {
  try {
    const { profileUrl } = req.body;

    if (!profileUrl) {
      return res.status(400).json({ error: "Devpost profile URL is required." });
    }

    // Basic URL validation
    if (!profileUrl.includes("devpost.com")) {
      return res.status(400).json({ error: "Please enter a valid Devpost profile URL." });
    }

    // Save to user document
    await User.findByIdAndUpdate(req.session.userId, { devpostProfile: profileUrl });

    res.json({ message: "Devpost profile saved! Fetching projects now..." });

  } catch (err) {
    console.error("Add devpost profile error:", err);
    res.status(500).json({ error: "Server error." });
  }
});

// ─── GET /api/fetch-devpost-projects ─────────────────────────
// Manually trigger Devpost scrape for logged-in user
router.get("/fetch-devpost-projects", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user.devpostProfile) {
      return res.status(400).json({ error: "No Devpost profile linked. Please add one first." });
    }

    const result = await fetchAndSaveDevpostProjects(user._id, user.devpostProfile);

    res.json({
      message: `Devpost sync complete! Found ${result.newCount} new project(s).`,
      newProjects: result.newProjects,
      totalFound: result.total
    });

  } catch (err) {
    console.error("Fetch devpost error:", err);
    res.status(500).json({ error: "Failed to fetch Devpost projects: " + err.message });
  }
});

module.exports = router;
