// ============================================================
// routes/chatbot.js — Hackathon suggestion chatbot (BONUS)
// ============================================================

const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// ─── POST /api/chatbot/suggest ────────────────────────────────
// Suggests hackathons based on user's history (rule-based, no AI needed)
router.post("/chatbot/suggest", async (req, res) => {
  try {
    const { userId, message } = req.body;

    let suggestions = [];
    let reply = "";

    if (userId) {
      // Fetch user's past projects to understand their interests
      const projects = await Project.find({ userId }).limit(20);

      // Build a profile: which hackathons they joined
      const names = projects.map(p => p.hackathonName.toLowerCase());
      const isWinner = projects.some(p => p.status === "winner");
      const count = projects.length;

      // Rule-based suggestions
      if (count === 0) {
        reply = "You haven't submitted any hackathons yet! Here are some beginner-friendly hackathons to try:";
        suggestions = [
          { name: "HackMIT",         url: "https://hackershackathon.devpost.com", level: "Beginner" },
          { name: "MLH Local Hack Day", url: "https://localhackday.mlh.io",    level: "Beginner" },
          { name: "Unstop Hackathons",  url: "https://unstop.com/hackathons",   level: "All levels" }
        ];
      } else if (isWinner) {
        reply = "🏆 Congratulations on your wins! Here are advanced hackathons for top performers:";
        suggestions = [
          { name: "Smart India Hackathon", url: "https://www.sih.gov.in",           level: "Advanced" },
          { name: "Google Hashcode",        url: "https://codingcompetitions.withgoogle.com", level: "Expert" },
          { name: "Codeforces Rounds",      url: "https://codeforces.com",           level: "Expert" }
        ];
      } else if (count < 5) {
        reply = `You've participated in ${count} hackathon(s). Keep going! Here are some great upcoming ones:`;
        suggestions = [
          { name: "DevPost Hackathons",   url: "https://devpost.com/hackathons",   level: "All levels" },
          { name: "Unstop Challenges",    url: "https://unstop.com/hackathons",    level: "All levels" },
          { name: "AngelHack",            url: "https://angelhack.com",            level: "Intermediate" }
        ];
      } else {
        reply = `Great track record with ${count} hackathons! Here are some specialized picks:`;
        suggestions = [
          { name: "ETHGlobal (Web3)",     url: "https://ethglobal.com",            level: "Intermediate" },
          { name: "NASA Space Apps",      url: "https://www.spaceappschallenge.org", level: "Intermediate" },
          { name: "HackerEarth Sprints",  url: "https://www.hackerearth.com/challenges/hackathon/", level: "All levels" }
        ];
      }

    } else {
      // Generic suggestions when not logged in
      reply = "Here are some popular hackathons you can join right now:";
      suggestions = [
        { name: "Devpost Hackathons",   url: "https://devpost.com/hackathons",    level: "All levels" },
        { name: "Unstop Hackathons",    url: "https://unstop.com/hackathons",     level: "All levels" },
        { name: "MLH Hackathons",       url: "https://mlh.io/seasons/2024/events", level: "Student" }
      ];
    }

    // Handle the message for basic Q&A
    const lowerMsg = (message || "").toLowerCase();
    if (lowerMsg.includes("trust") || lowerMsg.includes("score")) {
      reply = "Your trust score increases when you upload valid proof images that match your submission. Winner submissions with verified certificates give the biggest boost!";
      suggestions = [];
    } else if (lowerMsg.includes("points")) {
      reply = "Points system: Registered = 5pts, Participated = 20pts, Winner = 50pts. Your final score = points × (trust score / 100).";
      suggestions = [];
    } else if (lowerMsg.includes("devpost")) {
      reply = "Link your Devpost profile in the dashboard and we'll automatically track all your submissions! Projects are synced every 6 hours.";
      suggestions = [];
    }

    res.json({ reply, suggestions });

  } catch (err) {
    console.error("Chatbot error:", err);
    res.status(500).json({ reply: "Sorry, I'm having trouble right now. Please try again!", suggestions: [] });
  }
});

module.exports = router;
