const { buildStoryPromptPayload } = require("../utils/promptBuilder");

// Prompt taslagini demo olarak uretir
const getDemoPrompt = async ({ topic, character, genre, length }) => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return buildStoryPromptPayload({ topic, character, genre, length });
};

module.exports = {
  getDemoPrompt,
};
