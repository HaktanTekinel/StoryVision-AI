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
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL || "imagen-4.0-fast-generate-001",
  geminiTtsModel: process.env.GEMINI_TTS_MODEL || "gemini-2.5-flash-preview-tts",
  geminiTtsVoice: process.env.GEMINI_TTS_VOICE || "Kore",

  imageProvider: process.env.IMAGE_PROVIDER || "huggingface",
  imageFallbackEnabled: process.env.IMAGE_FALLBACK_ENABLED !== "false",

  pollinationsBaseUrl:
    process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai",
  pollinationsModel: process.env.POLLINATIONS_MODEL || "flux",

  aiHordeApiKey: process.env.AI_HORDE_API_KEY || "0000000000",
  aiHordeBaseUrl: process.env.AI_HORDE_BASE_URL || "https://aihorde.net/api/v2",
  aiHordeModel: process.env.AI_HORDE_MODEL || "auto",
  aiHordeClientAgent: process.env.AI_HORDE_CLIENT_AGENT || "StoryVisionAI:1.0",
  aiHordeTimeoutSeconds: Number(process.env.AI_HORDE_TIMEOUT_SECONDS) || 600,

  hfApiToken: process.env.HF_API_TOKEN || "",
  hfImageModel: process.env.HF_IMAGE_MODEL || "Tongyi-MAI/Z-Image-Turbo",
  hfImageProvider: process.env.HF_IMAGE_PROVIDER || "fal-ai",
  hfImageBaseUrl:
    process.env.HF_IMAGE_BASE_URL || "https://api-inference.huggingface.co/models",
  hfImageTimeoutSeconds: Number(process.env.HF_IMAGE_TIMEOUT_SECONDS) || 180,

  ttsProvider: process.env.TTS_PROVIDER || "windows",
  elevenlabsApiKey: process.env.ELEVENLABS_API_KEY || "",
  elevenlabsVoiceId: process.env.ELEVENLABS_VOICE_ID || "",
  elevenlabsModel: process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2",
  elevenlabsBaseUrl:
    process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io",

  publicBaseUrl: process.env.PUBLIC_BASE_URL || "",
  ffmpegPath: process.env.FFMPEG_PATH || "ffmpeg",
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

  if (String(env.imageProvider).toLowerCase() === "huggingface" && !env.hfApiToken.trim()) {
    errors.push("IMAGE_PROVIDER=huggingface icin HF_API_TOKEN tanimli olmali.");
  }

  if (String(env.imageProvider).toLowerCase() === "huggingface") {
    console.warn("BILGI: Gorsel uretimi Hugging Face ile yapilacak.");
  }

  if (String(env.imageProvider).toLowerCase() === "aihorde") {
    console.warn("BILGI: Gorsel uretimi AI Horde ile yapilacak. Anonymous key kullaniliyorsa bekleme suresi olabilir.");
  }

  if (String(env.imageProvider).toLowerCase() === "pollinations") {
    console.warn("BILGI: Gorsel uretimi Pollinations ile deneniyor.");
  }

  if (env.ttsProvider === "elevenlabs" && !env.elevenlabsApiKey.trim()) {
    console.warn(
      "UYARI: ELEVENLABS_API_KEY tanimli degil. Ses uretiminde Windows TTS fallback kullanilacak."
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

