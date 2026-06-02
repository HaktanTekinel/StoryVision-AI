const express = require("express");
const {
  createStory,
  getStories,
  getStoryById,
  deleteStory,
} = require("../controllers/storyController");

const router = express.Router();

router.get("/", getStories);
router.post("/generate", createStory);
router.get("/:id", getStoryById);
router.delete("/:id", deleteStory);

module.exports = router;