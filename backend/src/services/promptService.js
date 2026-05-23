const {
  buildStoryPromptPayload,
  buildPromptAssistantInstruction,
  buildPromptJsonInstruction,
} = require("../utils/promptBuilder");
const { generateStructuredText } = require("./geminiService");

const normalizePromptPackage = (promptPackage, input) => {
  const systemPrompt = String(promptPackage.systemPrompt || "").trim();
  const userPrompt = String(promptPackage.userPrompt || "").trim();

  if (!systemPrompt || !userPrompt) {
    throw new Error("AI prompt yaniti systemPrompt ve userPrompt alanlarini icermeli.");
  }

  const basePayload = buildStoryPromptPayload(input);

  return {
    systemPrompt,
    userPrompt,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userPrompt,
      },
    ],
    metadata: {
      ...basePayload.metadata,
      provider: "gemini",
      outputFormat: "prompt",
    },
  };
};

const getDemoPrompt = async ({ topic, character, genre, length }) => {
  const promptPackage = await generateStructuredText({
    systemPrompt: buildPromptAssistantInstruction({
      topic,
      character,
      genre,
      length,
    }),
    userPrompt: buildPromptJsonInstruction(),
    schemaName: '"systemPrompt", "userPrompt"',
  });

  return normalizePromptPackage(promptPackage, {
    topic,
    character,
    genre,
    length,
  });
};

module.exports = {
  getDemoPrompt,
};
