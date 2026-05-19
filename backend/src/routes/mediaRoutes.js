const express = require("express");
const {
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
} = require("../controllers/mediaController");

const router = express.Router();

// Gorsel, ses ve video demo endpointleri
router.get("/images/demo", getDemoImage);
router.get("/audio/demo", getDemoAudio);
router.get("/video/demo", getDemoVideo);

module.exports = router;
