const {
  buildStoryPromptPayload,
  buildStoryJsonInstruction,
} = require("../utils/promptBuilder");
const { generateStructuredText } = require("./geminiService");

const normalizeAiStory = (story, input) => {
  const title = String(story.title || "").trim();
  const content = String(story.content || "").trim();

  if (!title || !content) {
    throw new Error("AI hikaye yaniti title ve content alanlarini icermeli.");
  }

  return {
    title,
    content,
    prompt: buildStoryPromptPayload(input),
    provider: "gemini",
  };
};

const getDemoStory = async ({ topic, character, genre, length }) => {
  const promptPayload = buildStoryPromptPayload({
    topic,
    character,
    genre,
    length,
  });

  const aiStory = await generateStructuredText({
    systemPrompt: `${promptPayload.systemPrompt}\n\n${buildStoryJsonInstruction()}`,
    userPrompt: promptPayload.userPrompt,
    schemaName: '"title", "content"',
  });

  return normalizeAiStory(aiStory, { topic, character, genre, length });
};

module.exports = {
  getDemoStory,
};
