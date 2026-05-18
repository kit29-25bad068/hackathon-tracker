// ============================================================
// server.js — Main entry point for the Hackathon Tracker API
// ============================================================
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const session = require("express-session");
const path = require("path");
const cron = require("node-cron");

const app = express();
const PORT = process.env.PORT || 5000;


// ─── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],  // Allowed HTTP methods
  allowedHeaders: ["Content-Type"],
  credentials: true       // Allow cookies / sessions
}));
app.options("*", cors()); // Enable pre-flight CORS for all routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files as static assets
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Session setup (simple — no JWT needed)
app.use(session({
  secret: "hackathon-tracker-secret-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,        // Set true in production with HTTPS
    httpOnly: true,
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24  // 24 hours
  }
}));

// ─── MongoDB Connection ───────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hackathon_tracker";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("💡 Make sure MongoDB is running: sudo systemctl start mongod");
  });

// ─── Routes ──────────────────────────────────────────────────
const authRoutes    = require("./routes/auth");
const projectRoutes = require("./routes/projects");
const devpostRoutes = require("./routes/devpost");
const chatbotRoutes = require("./routes/chatbot");

app.use("/api/auth",    authRoutes);
app.use("/api",         projectRoutes);
app.use("/api",         devpostRoutes);
app.use("/api",         chatbotRoutes);

// ─── Health Check ─────────────────────────────────────────────
app.use(express.static(path.join(__dirname, "../frontend"))); // Serve static files from 'public' directory
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Hackathon Tracker API is running 🚀" });
});

// ─── Cron Job: Auto-fetch Devpost every 6 hours ───────────────
const { fetchAndSaveDevpostProjects } = require("./scraper/devpostScraper");
const User = require("./models/User");

cron.schedule("0 */6 * * *", async () => {
  console.log("🔄 [CRON] Fetching Devpost profiles...");
  try {
    const users = await User.find({ devpostProfile: { $exists: true, $ne: "" } });
    for (const user of users) {
      await fetchAndSaveDevpostProjects(user._id, user.devpostProfile);
    }
    console.log(`✅ [CRON] Updated ${users.length} Devpost profiles`);
  } catch (err) {
    console.error("❌ [CRON] Error:", err.message);
  }
});

// ─── Start Server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 API Health: http://localhost:${PORT}/api/health\n`);
});
