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
  geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-3.5-flash",
};

const validateEnv = () => {
  const errors = [];

  if (Number.isNaN(env.port) || env.port <= 0) {
    errors.push("PORT gecerli bir pozitif sayi olmali.");
  }

  if (Array.isArray(env.corsOrigin) && env.corsOrigin.length === 0) {
    errors.push("CORS_ORIGIN bos bir liste olamaz.");
  }

  if (!env.geminiApiKey.trim()) {
    errors.push("GEMINI_API_KEY veya GOOGLE_API_KEY tanimli olmali.");
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
