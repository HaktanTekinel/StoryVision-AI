const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");

const storyRoutes = require("./routes/storyRoutes");
const promptRoutes = require("./routes/promptRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const { sendSuccess } = require("./utils/apiResponse");

const app = express();

app.disable("x-powered-by");

// JSON istegini okumak icin temel middleware
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// Farkli originlerden gelen isteklere izin verir
app.use(
  cors({
    origin: env.corsOrigin,
  })
);

// Basit saglik kontrolu
app.get("/", (req, res) => {
  return sendSuccess(res, {
    message: "StoryVision AI Backend calisiyor.",
    data: {
      service: "storyvision-ai-backend",
      status: "healthy",
    },
  });
});

app.get("/api/health", (req, res) => {
  return sendSuccess(res, {
    message: "API saglik kontrolu basarili.",
    data: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Hikaye, prompt ve medya endpointlerini baglar
app.use("/api/stories", storyRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/media", mediaRoutes);

// Tanimsiz rotalari yakalar
app.use(notFound);

// Merkezi hata yakalama katmani
app.use(errorHandler);

module.exports = app;
