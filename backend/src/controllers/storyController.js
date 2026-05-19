const storyService = require("../services/storyService");
const { validateStoryPromptInput } = require("../utils/promptValidator");

// Istekten gelen query ve body alanlarini tek yerde toplar
const collectStoryInput = (req) => {
  return {
    ...req.query,
    ...req.body,
  };
};

// Demo hikaye endpointi icin controller
const getDemoStory = async (req, res) => {
  try {
    const { isValid, errors, data } = validateStoryPromptInput(collectStoryInput(req));

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Gecersiz hikaye girdileri.",
        errors,
      });
    }

    const story = await storyService.getDemoStory(data);

    return res.status(200).json({
      success: true,
      data: story,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo hikaye olusturulurken bir hata olustu.",
    });
  }
};

module.exports = {
  getDemoStory,
};
