// ============================================================
// utils/ocrValidation.js — Extract text from image using OCR
// ============================================================

const Tesseract = require("tesseract.js");

/**
 * Keywords that suggest a legitimate proof document
 * (certificate, participation letter, winner announcement, etc.)
 */
const VALID_KEYWORDS = [
  "certificate", "certify", "certified",
  "participation", "participated",
  "winner", "won", "first place", "second place", "third place",
  "hackathon", "hack", "sprint",
  "award", "achievement", "recognition",
  "congratulations", "congratulate",
  "unstop", "devpost", "mlh",
  "this is to certify", "has participated", "has won"
];

/**
 * Run OCR on an image file and validate against hackathon name + keywords.
 *
 * @param {string} imagePath - Absolute path to the uploaded image
 * @param {string} hackathonName - Name entered by the user
 * @returns {object} { validated: boolean, text: string, note: string }
 */
async function validateProofWithOCR(imagePath, hackathonName) {
  console.log(`🔍 Starting OCR for: ${imagePath}`);

  // Tesseract.js extracts text from the image
  const result = await Tesseract.recognize(imagePath, "eng", {
    // Uncomment for verbose OCR logging:
    // logger: m => console.log(m)
  });

  const extractedText = result.data.text || "";
  const lowerText = extractedText.toLowerCase();
  const lowerHackathon = hackathonName.toLowerCase();

  console.log(`📄 OCR extracted ${extractedText.length} characters`);

  // ─── Check 1: Does the image text mention the hackathon name? ──
  // We do a partial match (e.g. "Smart India" matches "Smart India Hackathon")
  const hackathonWords = lowerHackathon.split(" ").filter(w => w.length > 3);
  const nameMatch = hackathonWords.length > 0
    ? hackathonWords.some(word => lowerText.includes(word))
    : false;

  // ─── Check 2: Are any validity keywords present? ─────────────
  const keywordMatch = VALID_KEYWORDS.some(kw => lowerText.includes(kw));

  // ─── Decision ─────────────────────────────────────────────────
  let validated = false;
  let note = "";

  if (extractedText.trim().length < 20) {
    // OCR extracted almost nothing — image might be too blurry or decorative
    validated = false;
    note = "OCR could not extract sufficient text from the image. Try a clearer screenshot.";
  } else if (nameMatch && keywordMatch) {
    validated = true;
    note = "✅ Proof validated: hackathon name and certificate keywords found in image.";
  } else if (!nameMatch && keywordMatch) {
    validated = false;
    note = "⚠️ Certificate keywords found but hackathon name not detected. Check the name spelling.";
  } else if (nameMatch && !keywordMatch) {
    validated = false;
    note = "⚠️ Hackathon name found but no certificate keywords detected. Upload a certificate or winner proof.";
  } else {
    validated = false;
    note = "❌ Neither hackathon name nor certificate keywords found in image. Please upload valid proof.";
  }

  return {
    validated,
    text: extractedText.substring(0, 1000), // Save first 1000 chars to DB
    note
  };
}

module.exports = { validateProofWithOCR };
