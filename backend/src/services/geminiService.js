const { GoogleGenAI } = require("@google/genai");
const { env } = require("../config/env");

const hasGeminiConfig = () => Boolean(env.geminiApiKey && env.geminiApiKey.trim());

const createClient = () => {
  if (!hasGeminiConfig()) {
    throw new Error("GEMINI_API_KEY tanimli degil.");
  }

  return new GoogleGenAI({
    apiKey: env.geminiApiKey,
  });
};

const extractJsonPayload = (text) => {
  if (!text) {
    throw new Error("AI modelinden bos cevap alindi.");
  }

  const trimmedText = text.trim();

  try {
    return JSON.parse(trimmedText);
  } catch {
    const match = trimmedText.match(/\{[\s\S]*\}/);

    if (!match) {
      throw new Error("AI yanitindan JSON ayristirilmadi.");
    }

    return JSON.parse(match[0]);
  }
};

const generateStructuredText = async ({ systemPrompt, userPrompt, schemaName }) => {
  const ai = createClient();

  const response = await ai.models.generateContent({
    model: env.geminiTextModel,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemPrompt}

Cevabi sadece gecerli JSON olarak ver. Ek aciklama yazma.
Alanlar: ${schemaName}

Kullanici istegi: ${userPrompt}`,
          },
        ],
      },
    ],
  });

  return extractJsonPayload(response.text);
};

const generateText = async ({ prompt }) => {
  const ai = createClient();

  const response = await ai.models.generateContent({
    model: env.geminiTextModel,
    contents: prompt,
  });

  return response.text || "";
};

module.exports = {
  hasGeminiConfig,
  generateStructuredText,
  generateText,
};