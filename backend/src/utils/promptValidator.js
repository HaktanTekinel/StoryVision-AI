const { DEFAULT_PROMPT_VALUES, SUPPORTED_LENGTHS } = require("./promptConfig");

// Prompt girdilerini temizler ve temel kurallara gore kontrol eder
const validateStoryPromptInput = (input = {}) => {
  const errors = [];

  const topic = String(input.topic || "").trim() || DEFAULT_PROMPT_VALUES.topic;
  const character = String(input.character || "").trim() || DEFAULT_PROMPT_VALUES.character;
  const genre = String(input.genre || "").trim() || DEFAULT_PROMPT_VALUES.genre;
  const length = String(input.length || "").trim() || DEFAULT_PROMPT_VALUES.length;

  if (!SUPPORTED_LENGTHS.includes(length)) {
    errors.push("length alanı kisa, orta veya uzun olmali.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      topic,
      character,
      genre,
      length,
    },
  };
};

module.exports = {
  validateStoryPromptInput,
};
