const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const extractJsonPayload = (text) => {
  if (!text) {
    throw new Error("AI modelinden bos cevap alindi.");
  }

  const trimmedText = text.trim();

  try {
    return JSON.parse(trimmedText);
  } catch (error) {
    const match = trimmedText.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI yanitindan JSON ayristirilmadi.");
    }

    return JSON.parse(match[0]);
  }
};

const generateStructuredText = async ({ systemPrompt, userPrompt, schemaName }) => {
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}\n\nCevabi sadece gecerli JSON olarak ver. Ek aciklama yazma.\n\nAlanlar: ${schemaName}\n\nKullanici istegi: ${userPrompt}`,
          },
        ],
      },
    ],
  });

  return extractJsonPayload(response.text);
};

const generateText = async ({ prompt }) => {
  const response = await ai.models.generateContent({
    model: env.geminiModel,
    contents: prompt,
  });

  return response.text || "";
};

module.exports = {
  generateStructuredText,
  generateText,
};
