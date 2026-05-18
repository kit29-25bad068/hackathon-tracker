// ============================================================
// utils/trustScore.js — Update user trust score logic
// ============================================================

const User = require("../models/User");

/**
 * Update a user's trust score based on their submission quality.
 *
 * Rules:
 *  - Has proof image AND OCR validated  → +5
 *  - Has proof image but NOT validated  → +1 (still tried)
 *  - No proof image                     → -3
 *  - Has a valid link                   → +2
 *  - Score is always clamped to 0–100
 *
 * @param {string} userId - MongoDB user ID
 * @param {object} factors - { hasProof, proofValidated, hasLink }
 */
async function updateTrustScore(userId, factors) {
  try {
    const { hasProof, proofValidated, hasLink } = factors;
    let delta = 0;

    if (hasProof && proofValidated) {
      delta += 5;   // Best case: proof uploaded and verified
    } else if (hasProof && !proofValidated) {
      delta += 1;   // Proof uploaded but didn't pass OCR check
    } else if (!hasProof) {
      delta -= 3;   // No proof is suspicious
    }

    if (hasLink) {
      delta += 2;   // Having a link is a good sign
    }

    // Fetch current score
    const user = await User.findById(userId);
    if (!user) return;

    // Clamp to 0–100
    const newScore = Math.min(100, Math.max(0, user.trustScore + delta));

    await User.findByIdAndUpdate(userId, { trustScore: newScore });

    console.log(`🔢 Trust score updated for user ${userId}: ${user.trustScore} → ${newScore} (delta: ${delta > 0 ? "+" : ""}${delta})`);

  } catch (err) {
    console.error("Error updating trust score:", err.message);
    // Non-fatal — don't throw
  }
}

module.exports = { updateTrustScore };
