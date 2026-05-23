const storyService = require("../services/storyService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../errors/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const { validateStoryPromptInput } = require("../utils/promptValidator");

// Istekten gelen query ve body alanlarini tek yerde toplar
const collectStoryInput = (req) => {
  return {
    ...req.query,
    ...req.body,
  };
};

// Demo hikaye endpointi icin controller
const getDemoStory = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateStoryPromptInput(collectStoryInput(req));

  if (!isValid) {
    throw new AppError(`Gecersiz hikaye girdileri: ${errors.join(" ")}`, 400);
  }

  const story = await storyService.getDemoStory(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye olusturuldu.",
    data: story,
  });
});

module.exports = {
  getDemoStory,
};
