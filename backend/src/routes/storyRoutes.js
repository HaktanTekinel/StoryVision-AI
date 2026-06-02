const express = require("express");
const {
  createStory,
  getStories,
  getStoryById,
  deleteStory,
} = require("../controllers/storyController");
const { generateStoryImages } = require("../controllers/mediaController");

const router = express.Router();

router.get("/", getStories);
router.post("/generate", createStory);

router.post("/:id/images", generateStoryImages);

router.get("/:id", getStoryById);
router.delete("/:id", deleteStory);

module.exports = router;