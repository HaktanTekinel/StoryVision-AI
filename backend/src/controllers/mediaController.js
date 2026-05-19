const mediaService = require("../services/mediaService");

// Demo gorsel talebini yonetir
const getDemoImage = async (req, res) => {
  try {
    const { topic = "kayip zaman", genre = "fantastik" } = req.query;

    const result = await mediaService.getDemoImage({ topic, genre });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo gorsel olusturulurken bir hata olustu.",
    });
  }
};

// Demo ses talebini yonetir
const getDemoAudio = async (req, res) => {
  try {
    const { topic = "kayip zaman", character = "genc bir yazar" } = req.query;

    const result = await mediaService.getDemoAudio({ topic, character });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo ses olusturulurken bir hata olustu.",
    });
  }
};

// Demo video talebini yonetir
const getDemoVideo = async (req, res) => {
  try {
    const { topic = "kayip zaman", genre = "fantastik", length = "orta" } = req.query;

    const result = await mediaService.getDemoVideo({ topic, genre, length });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo video olusturulurken bir hata olustu.",
    });
  }
};

module.exports = {
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};
