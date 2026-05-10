const express = require("express");
const { getDemoStory } = require("../controllers/storyController");

const router = express.Router();

// Frontend demo akisi icin sahte hikaye endpoint'i
router.get("/demo", getDemoStory);
router.post("/demo", getDemoStory);

module.exports = router;
