// ============================================================
// script.js — Shared utilities used across all frontend pages
// ============================================================

// Base URL for all API calls. Change this if your server
// runs on a different port or host.
const API_BASE = window.location.hostname === "localhost" 
  ? "http://localhost:5000/api" 
  : "/api";

// ─── apiFetch ────────────────────────────────────────────────
// A wrapper around fetch() that:
//   - Prepends the API base URL
//   - Sends credentials (session cookies) automatically
//   - Sets JSON Content-Type for non-FormData bodies
//
// Usage:
//   const res = await apiFetch("/projects");
//   const res = await apiFetch("/auth/login", "POST", { email, password });
//
async function apiFetch(path, method = "GET", body = null) {
  const options = {
    method,
    credentials: "include",   // Send session cookie with every request
    headers: {}
  };

  // Only set Content-Type for JSON bodies
  // (FormData sets its own Content-Type automatically)
  if (body && !(body instanceof FormData)) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  return fetch(`${API_BASE}${path}`, options);
}

// ─── checkAuth ────────────────────────────────────────────────
// Checks if a user is currently logged in by calling /auth/me.
// Returns the user object if logged in, null otherwise.
// Does NOT redirect — use requireAuth() for that.
//
async function checkAuth() {
  try {
    const res = await apiFetch("/auth/me");
    if (res.ok) {
      const data = await res.json();
      // Keep localStorage in sync
      if (data.user) {
        localStorage.setItem("hacktrack_user", JSON.stringify(data.user));
      }
      return data.user;
    }
  } catch (err) {
    // Server unreachable — fall through
  }
  return null;
}

// ─── requireAuth ──────────────────────────────────────────────
// Like checkAuth(), but redirects to login.html if not logged in.
// Use this at the top of protected pages (dashboard, add).
//
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// ─── escapeHtml ───────────────────────────────────────────────
// Prevents XSS by escaping HTML special characters.
// Always use this when inserting user-provided text into innerHTML.
//
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;")
    .replace(/'/g,  "&#039;");
}

// ─── formatDate ───────────────────────────────────────────────
// Converts an ISO date string to a readable format.
// Example: "2024-03-15T10:00:00Z" → "Mar 15, 2024"
//
function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric"
  });
}

// ─── Auto-update nav based on login state ─────────────────────
// Runs on every page load to show/hide nav items appropriately.
//
(async function updateNav() {
  const user = await checkAuth();
  // Optionally highlight nav items here in the future
})();
