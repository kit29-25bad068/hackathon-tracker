# ⚡ HackTrack — AI-Powered Hackathon Tracker & Leaderboard

A full-stack web application to track hackathon submissions from Devpost (auto-scraped)
and Unstop (manual with OCR proof validation), featuring a trust score system and
live leaderboard.

---

## 📁 Project Structure

```
hackathon-tracker/
├── backend/
│   ├── server.js                  ← Main Express server
│   ├── package.json               ← Backend dependencies
│   ├── models/
│   │   ├── User.js                ← User schema (auth + trust score)
│   │   └── Project.js             ← Hackathon submission schema
│   ├── routes/
│   │   ├── auth.js                ← POST /signup, /login, /logout, GET /me
│   │   ├── projects.js            ← POST /add-project, GET /projects, /leaderboard
│   │   ├── devpost.js             ← POST /add-devpost-profile, GET /fetch-devpost-projects
│   │   └── chatbot.js             ← POST /chatbot/suggest
│   ├── scraper/
│   │   └── devpostScraper.js      ← Cheerio-based Devpost HTML scraper
│   ├── utils/
│   │   ├── trustScore.js          ← Trust score update logic
│   │   └── ocrValidation.js       ← Tesseract.js OCR + keyword validation
│   └── uploads/                   ← Uploaded proof images (auto-created)
│
└── frontend/
    ├── index.html                 ← Home / landing page
    ├── login.html                 ← Login form
    ├── signup.html                ← Signup form
    ├── dashboard.html             ← User dashboard with stats + project list
    ├── add.html                   ← Submit hackathon (Unstop or Devpost)
    ├── leaderboard.html           ← Global leaderboard
    ├── script.js                  ← Shared JS utilities (apiFetch, checkAuth, etc.)
    └── style.css                  ← All styles (dark industrial theme)
```

---

## ✅ Prerequisites

Before starting, install these tools:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | Comes with Node.js |
| MongoDB | v6+ | https://www.mongodb.com/try/download/community |

**Verify installations:**
```bash
node --version    # Should print v18.x.x or higher
npm --version     # Should print 9.x.x or higher
mongod --version  # Should print v6.x.x or higher
```

---

## 🚀 Setup Instructions (Step by Step)

### Step 1 — Clone / download the project

```bash
# If you have git:
git clone <your-repo-url>
cd hackathon-tracker

# Or just unzip the downloaded folder and open it
```

### Step 2 — Start MongoDB

MongoDB must be running before you start the backend.

**On Linux/Mac:**
```bash
sudo systemctl start mongod
# or
mongod --dbpath /data/db
```

**On Mac with Homebrew:**
```bash
brew services start mongodb-community
```

**On Windows:**
```bash
# Start MongoDB service via Services app
# or run:
net start MongoDB
```

**Verify MongoDB is running:**
```bash
mongosh
# You should see a MongoDB shell prompt
# Type: exit   to quit
```

### Step 3 — Install backend dependencies

```bash
cd backend
npm install
```

This installs:
- `express` — Web server framework
- `mongoose` — MongoDB ORM
- `bcryptjs` — Password hashing
- `express-session` — Session management
- `cors` — Cross-Origin Resource Sharing
- `multer` — File upload handling
- `tesseract.js` — OCR (reads text from images)
- `cheerio` — HTML scraping (Devpost)
- `node-fetch` — HTTP requests for scraping
- `node-cron` — Scheduled jobs

> ⚠️ **Note:** `tesseract.js` downloads language data on first use (~10MB).
> First OCR call will be slow. Subsequent calls are faster.

### Step 4 — Start the backend server

```bash
# Inside /backend folder:
node server.js

# Or with auto-restart on file changes:
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on http://localhost:5000
📋 API Health: http://localhost:5000/api/health
```

### Step 5 — Open the frontend

The frontend is plain HTML — no build step needed!

**Option A — Open directly in browser (simplest):**
```
Open frontend/index.html in your browser
```

**Option B — Serve with a simple HTTP server (recommended):**
```bash
# Install live-server globally (one time):
npm install -g live-server

# From the frontend folder:
cd frontend
live-server --port=3000
```

Then visit: `http://localhost:3000`

---

## 🌐 API Endpoints Reference

### Authentication
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/auth/signup` | `{name, email, password}` | Create new account |
| POST | `/api/auth/login` | `{email, password}` | Login |
| POST | `/api/auth/logout` | — | Logout |
| GET | `/api/auth/me` | — | Get logged-in user info |

### Projects
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/add-project` | FormData: `hackathonName, link, status, proofImage` | Submit Unstop project |
| GET | `/api/projects` | — | Get your projects |
| GET | `/api/leaderboard` | — | Get all users ranked by score |

### Devpost
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/add-devpost-profile` | `{profileUrl}` | Save Devpost URL |
| GET | `/api/fetch-devpost-projects` | — | Scrape & import Devpost projects |

### Chatbot (Bonus)
| Method | Path | Body | Description |
|--------|------|------|-------------|
| POST | `/api/chatbot/suggest` | `{message, userId?}` | Get hackathon suggestions |

---

## 🎯 How to Use the App

### Registering & Logging In
1. Go to `signup.html` and create an account
2. You'll be redirected to the dashboard automatically

### Submitting an Unstop Hackathon
1. Go to `add.html` → **Manual (Unstop)** tab
2. Enter the exact hackathon name (must match certificate text for OCR)
3. Add the Unstop link (optional but increases trust score)
4. Select your status: Registered / Participated / Winner
5. Upload a screenshot or certificate image
6. Click Submit — OCR runs automatically!

### Linking Devpost
1. Go to `dashboard.html` → Click **Link Devpost**
2. Enter your Devpost profile URL: `https://devpost.com/yourusername`
3. Click **Save & Sync** — projects are imported automatically
4. Sync runs every 6 hours automatically via cron

### Viewing the Leaderboard
- Go to `leaderboard.html`
- Rankings use: `Final Score = Raw Points × (Trust Score / 100)`
- Top 3 are shown on the podium with medals

---

## 🔧 Common Errors & Fixes

### ❌ "Cannot connect to server"
**Cause:** Backend not running
**Fix:**
```bash
cd backend
node server.js
# Check for errors in the terminal
```

### ❌ "MongoDB connection error"
**Cause:** MongoDB not running
**Fix:**
```bash
sudo systemctl start mongod      # Linux
brew services start mongodb-community  # Mac
```

### ❌ "Error: Cannot find module 'cheerio'"
**Cause:** Dependencies not installed
**Fix:**
```bash
cd backend
npm install
```

### ❌ OCR takes too long / times out
**Cause:** First OCR call downloads Tesseract language data
**Fix:** Wait for first call to complete. Subsequent calls are much faster (5–15 seconds).

### ❌ Devpost scraping returns 0 projects
**Cause:** Devpost changed their HTML structure or your profile is private
**Fix:**
1. Make sure your Devpost profile is **public**
2. Visit your profile URL in a browser to verify it loads
3. Check the backend terminal for detailed error messages

### ❌ CORS error in browser console
**Cause:** Frontend and backend on different ports
**Fix:** The server already has CORS configured. Make sure you're calling `http://localhost:5000`, not a different URL. Check `API_BASE` in `script.js`.

### ❌ File upload fails
**Cause:** File too large (>5MB) or wrong format
**Fix:** Use JPEG or PNG images under 5MB. GIF and WebP are also supported.

### ❌ Session not persisting (logged out on refresh)
**Cause:** Browser blocking cookies
**Fix:** Use `live-server` or any HTTP server instead of opening HTML files directly with `file://`

---

## 🏗️ Environment Variables (Optional)

Create a `.env` file in `/backend` to override defaults:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/hackathon_tracker
SESSION_SECRET=your-super-secret-key-change-this
```

To use `.env`, install dotenv:
```bash
npm install dotenv
```

And add to top of `server.js`:
```javascript
require("dotenv").config();
```

---

## 🎁 Bonus Features Included

- **🤖 Chatbot** (`/api/chatbot/suggest`): Rule-based hackathon recommendations
  based on user history. Accessible via the floating chatbot widget on every page.
  Ask it: "suggest", "how do points work?", "what is trust score?", "devpost"

- **⏰ Auto-sync Cron**: Devpost profiles are automatically refreshed every 6 hours.

- **🔍 OCR Validation**: Tesseract.js reads uploaded images and cross-checks
  hackathon names + certificate keywords — no manual review needed.

- **🛡️ Trust Score**: Dynamic score (0–100) that penalizes unverified submissions
  and rewards verified ones. Affects final leaderboard ranking.

- **📊 Password Strength Meter**: Live indicator on signup page.

- **🎨 Drag & Drop Upload**: Drop proof images directly into the upload area.

---

## 📦 Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose ODM |
| Auth | express-session + bcryptjs |
| Scraping | Cheerio + node-fetch |
| OCR | Tesseract.js (v4) |
| File Upload | Multer |
| Scheduling | node-cron |
| CORS | cors package |

---

## 🛠️ Development Tips

- Use `npm run dev` (nodemon) in the backend for auto-restart on file changes
- Use `live-server` for the frontend to auto-reload on changes
- MongoDB data is stored in the default `/data/db` directory
- Uploaded images are stored in `/backend/uploads/`
- To reset all data: drop the `hackathon_tracker` database in MongoDB:
  ```bash
  mongosh
  use hackathon_tracker
  db.dropDatabase()
  ```
