// ============================================================
// scraper/devpostScraper.js — Scrape Devpost profile page
// ============================================================

const fetch = require("node-fetch");
const cheerio = require("cheerio");
const Project = require("../models/Project");
const User = require("../models/User");
const { updateTrustScore } = require("../utils/trustScore");

/**
 * Fetch a Devpost profile and save any new projects to DB.
 * @param {string} userId  - MongoDB user ID
 * @param {string} profileUrl - e.g. "https://devpost.com/johndoe"
 */
async function fetchAndSaveDevpostProjects(userId, profileUrl) {
  // Normalize URL: strip trailing slash
  const cleanUrl = profileUrl.replace(/\/$/, "");

  // Devpost profile page HTML
  const response = await fetch(cleanUrl, {
    headers: {
      // Pretend to be a browser so Devpost doesn't block us
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    },
    timeout: 15000  // 15 second timeout
  });

  if (!response.ok) {
    throw new Error(`Devpost returned HTTP ${response.status}. Check the profile URL.`);
  }

  const html = await response.text();

  // Load HTML into Cheerio (like jQuery for Node.js)
  const $ = cheerio.load(html);

  const scraped = [];

  // ─── Parse Devpost project cards ──────────────────────────
  // Devpost uses <div class="software-entry"> for each project
  $("div.software-entry, article.software, .project-list-item").each((i, el) => {
    const titleEl = $(el).find("h5.software-title, h2.title, .title a, h5 a").first();
    const hackathonEl = $(el).find(".hackathon-title, .challenge-names a, .challenge-label").first();
    const linkEl = $(el).find("a[href]").first();

    const projectTitle = titleEl.text().trim();
    const hackathonName = hackathonEl.text().trim() || "Hackathon on Devpost";
    let link = linkEl.attr("href") || "";

    // Make relative links absolute
    if (link && !link.startsWith("http")) {
      link = "https://devpost.com" + link;
    }

    if (projectTitle) {
      scraped.push({ projectTitle, hackathonName, link });
    }
  });

  // ─── Fallback: Try alternative Devpost HTML structure ─────
  if (scraped.length === 0) {
    $("a[href*='/software/']").each((i, el) => {
      const projectTitle = $(el).text().trim();
      const link = $(el).attr("href");
      if (projectTitle && projectTitle.length > 2) {
        scraped.push({
          projectTitle,
          hackathonName: "Devpost Hackathon",
          link: link.startsWith("http") ? link : "https://devpost.com" + link
        });
      }
    });
  }

  console.log(`📦 Scraped ${scraped.length} projects from ${cleanUrl}`);

  // ─── Save only NEW projects (avoid duplicates) ────────────
  let newCount = 0;
  const newProjects = [];

  for (const item of scraped) {
    // Check if this project link already exists for this user
    const exists = await Project.findOne({
      userId,
      source: "devpost",
      $or: [
        { link: item.link },
        { projectTitle: item.projectTitle, hackathonName: item.hackathonName }
      ]
    });

    if (!exists) {
      const project = new Project({
        userId,
        source: "devpost",
        hackathonName: item.hackathonName,
        projectTitle: item.projectTitle,
        link: item.link,
        status: "participated",      // Devpost submissions = participated
        points: 20,                  // participated = 20 pts
        proofValidated: true,        // Devpost links are trusted
        validationNote: "Auto-verified via Devpost"
      });
      await project.save();

      // Add points to user
      await User.findByIdAndUpdate(userId, { $inc: { totalPoints: 20 } });

      // Trust score boost: devpost link is valid
      await updateTrustScore(userId, { hasProof: false, proofValidated: true, hasLink: true });

      newProjects.push(project);
      newCount++;
    }
  }

  return { newCount, newProjects, total: scraped.length };
}

module.exports = { fetchAndSaveDevpostProjects };
