const express = require("express");
const cors = require("cors");
const path = require("path");
const { env } = require("./config/env");

const storyRoutes = require("./routes/storyRoutes");
const promptRoutes = require("./routes/promptRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");
const { sendSuccess } = require("./utils/apiResponse");

const app = express();

app.disable("x-powered-by");

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

app.use(
  cors({
    origin: env.corsOrigin,
  })
);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

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

app.use("/api/stories", storyRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/media", mediaRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;