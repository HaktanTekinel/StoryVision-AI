const express = require("express");
const cors = require("cors");

const storyRoutes = require("./routes/storyRoutes");
const promptRoutes = require("./routes/promptRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const notFound = require("./middlewares/notFound");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// JSON istegini okumak icin temel middleware
app.use(express.json());

// Farkli originlerden gelen isteklere izin verir
app.use(cors());

// Basit saglik kontrolu
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "StoryVision AI Backend calisiyor.",
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
