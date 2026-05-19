const promptService = require("../services/promptService");
const { validateStoryPromptInput } = require("../utils/promptValidator");

// Demo prompt endpointi icin controller
const getDemoPrompt = async (req, res) => {
  try {
    const { isValid, errors, data } = validateStoryPromptInput(req.query);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Gecersiz prompt girdileri.",
        errors,
      });
    }

    const result = await promptService.getDemoPrompt(data);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Demo prompt olusturulurken bir hata olustu.",
    });
  }
};

module.exports = {
  getDemoPrompt,
};
