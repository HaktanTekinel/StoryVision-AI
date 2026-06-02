const express = require("express");
const {
  createStory,
  getStories,
  getStoryById,
  deleteStory,
} = require("../controllers/storyController");
const {
  generateStoryImages,
  generateStoryAudio,
  generateStoryVideo,
  generateStorySubtitles,
} = require("../controllers/mediaController");

const router = express.Router();

router.get("/", getStories);
router.post("/generate", createStory);

router.post("/:id/images", generateStoryImages);
router.post("/:id/audio", generateStoryAudio);
router.post("/:id/video", generateStoryVideo);
router.post("/:id/subtitles", generateStorySubtitles);

router.get("/:id", getStoryById);
router.delete("/:id", deleteStory);

module.exports = router;