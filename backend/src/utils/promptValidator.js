const { DEFAULT_PROMPT_VALUES, SUPPORTED_LENGTHS } = require("./promptConfig");

const MAX_FIELD_LENGTH = 120;

const normalizeText = (value, fallback) => {
  const normalized = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

  return normalized || fallback;
};

const validateFieldLength = (value, fieldName, errors) => {
  if (value.length > MAX_FIELD_LENGTH) {
    errors.push(`${fieldName} alanı ${MAX_FIELD_LENGTH} karakterden uzun olamaz.`);
  }
};

const buildNormalizedStoryInput = (input = {}) => {
  const topic = normalizeText(input.topic, DEFAULT_PROMPT_VALUES.topic);
  const character = normalizeText(input.character, DEFAULT_PROMPT_VALUES.character);
  const genre = normalizeText(input.genre, DEFAULT_PROMPT_VALUES.genre);
  const length = normalizeText(input.length, DEFAULT_PROMPT_VALUES.length).toLowerCase();

  return {
    topic,
    character,
    genre,
    length,
  };
};

const validateStoryPromptInput = (input = {}) => {
  const data = buildNormalizedStoryInput(input);
  const errors = [];

  validateFieldLength(data.topic, "topic", errors);
  validateFieldLength(data.character, "character", errors);
  validateFieldLength(data.genre, "genre", errors);

  if (!SUPPORTED_LENGTHS.includes(data.length)) {
    errors.push("length alanı kisa, orta veya uzun olmali.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data,
  };
};

const validateMediaImageInput = (input = {}) => {
  const topic = normalizeText(input.topic, DEFAULT_PROMPT_VALUES.topic);
  const genre = normalizeText(input.genre, DEFAULT_PROMPT_VALUES.genre);
  const errors = [];

  validateFieldLength(topic, "topic", errors);
  validateFieldLength(genre, "genre", errors);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      topic,
      genre,
    },
  };
};

const validateMediaAudioInput = (input = {}) => {
  const topic = normalizeText(input.topic, DEFAULT_PROMPT_VALUES.topic);
  const character = normalizeText(input.character, DEFAULT_PROMPT_VALUES.character);
  const errors = [];

  validateFieldLength(topic, "topic", errors);
  validateFieldLength(character, "character", errors);

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      topic,
      character,
    },
  };
};

const validateMediaVideoInput = (input = {}) => {
  const topic = normalizeText(input.topic, DEFAULT_PROMPT_VALUES.topic);
  const genre = normalizeText(input.genre, DEFAULT_PROMPT_VALUES.genre);
  const length = normalizeText(input.length, DEFAULT_PROMPT_VALUES.length).toLowerCase();
  const errors = [];

  validateFieldLength(topic, "topic", errors);
  validateFieldLength(genre, "genre", errors);

  if (!SUPPORTED_LENGTHS.includes(length)) {
    errors.push("length alanı kisa, orta veya uzun olmali.");
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: {
      topic,
      genre,
      length,
    },
  };
};

module.exports = {
  validateStoryPromptInput,
  validateMediaImageInput,
  validateMediaAudioInput,
  validateMediaVideoInput,
};
