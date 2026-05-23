const promptService = require("../services/promptService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../errors/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const { validateStoryPromptInput } = require("../utils/promptValidator");

const collectPromptInput = (req) => {
  return {
    ...req.query,
    ...req.body,
  };
};

// Demo prompt endpointi icin controller
const getDemoPrompt = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateStoryPromptInput(collectPromptInput(req));

  if (!isValid) {
    throw new AppError(`Gecersiz prompt girdileri: ${errors.join(" ")}`, 400);
  }

  const result = await promptService.getDemoPrompt(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Prompt paketi olusturuldu.",
    data: result,
  });
});

module.exports = {
  getDemoPrompt,
};
