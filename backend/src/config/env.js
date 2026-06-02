const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

const parseCorsOrigins = (value) => {
  if (!value || value === "*") {
    return true;
  }

  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  corsOrigin: parseCorsOrigins(process.env.CORS_ORIGIN),
  databaseUrl: process.env.DATABASE_URL || "",

  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiTextModel:
    process.env.GEMINI_TEXT_MODEL ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image",
  geminiTtsModel: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
  geminiTtsVoice: process.env.GEMINI_TTS_VOICE || "Kore",
};

const validateEnv = () => {
  const errors = [];

  if (Number.isNaN(env.port) || env.port <= 0) {
    errors.push("PORT gecerli bir pozitif sayi olmali.");
  }

  if (Array.isArray(env.corsOrigin) && env.corsOrigin.length === 0) {
    errors.push("CORS_ORIGIN bos bir liste olamaz.");
  }

  if (!env.databaseUrl.trim()) {
    errors.push("DATABASE_URL tanimli olmali.");
  }

  if (!env.geminiApiKey.trim()) {
    console.warn(
      "UYARI: GEMINI_API_KEY tanimli degil. Hikaye uretiminde gecici fallback metin kullanilacak."
    );
  }

  if (errors.length > 0) {
    throw new Error(`Ortam degiskenleri gecersiz: ${errors.join(" ")}`);
  }

  return env;
};

module.exports = {
  env,
  validateEnv,
};