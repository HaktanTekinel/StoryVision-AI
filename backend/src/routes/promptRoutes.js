const express = require("express");
const { getDemoPrompt } = require("../controllers/promptController");

const router = express.Router();

// Frontend icin prompt taslagi endpointi
router.get("/demo", getDemoPrompt);

module.exports = router;
