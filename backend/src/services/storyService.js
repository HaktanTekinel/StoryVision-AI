const storyRepository = require("../repositories/storyRepository");
const { generateStructuredText } = require("./geminiService");

const normalizeText = (value, fallback = "") => {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ") || fallback;
};

const normalizeLength = (value) => {
  const normalized = normalizeText(value, "Orta")
    .toLowerCase()
    .replaceAll("ı", "i");

  if (normalized.includes("kisa")) return "Kısa";
  if (normalized.includes("uzun")) return "Uzun";
  return "Orta";
};

const splitParagraphs = (content) => {
  return String(content || "")
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const buildStorySystemPrompt = (input) => {
  return `
Sen StoryVision AI projesi icin calisan profesyonel bir hikaye ve sahne tasarim asistanisin.

Gorevin:
- Turkce, akici ve yaratici bir hikaye uretmek.
- Hikayeyi video uretimine uygun sahnelere ayirmak.
- En az 3 sahne icin gorsel uretim promptu hazirlamak.

Kurallar:
- Cevabi sadece JSON olarak ver.
- Markdown kullanma.
- Kod blogu kullanma.
- Hikaye cocuklara ve genel izleyiciye uygun olsun.
- Sahne promptlari gorsel uretim modeline verilecek kadar detayli olsun.

Kullanici bilgileri:
- Fikir: ${input.idea}
- Baslik: ${input.title || "Model uygun baslik uretmeli"}
- Karakter: ${input.characterName}
- Mekan: ${input.place}
- Tur: ${input.genre}
- Ton: ${input.tone}
- Gorsel tarz: ${input.visualStyle}
- Uzunluk: ${input.length}
- Anlatici: ${input.narrator}

JSON formati:
{
  "title": "string",
  "synopsis": "string",
  "content": "string",
  "paragraphs": ["string"],
  "scenes": [
    {
      "title": "string",
      "description": "string",
      "prompt": "string",
      "mood": "string"
    }
  ]
}
`.trim();
};

const buildFallbackStory = (input) => {
  const title = input.title || `${input.characterName} ve Kaybolan Işık`;

  const paragraphs = [
    `${input.place} içinde yaşayan ${input.characterName}, ${input.idea} fikrinin peşinden gitmeye karar verdi. Her şey sıradan görünürken, küçük bir işaret onu beklenmedik bir yolculuğa çağırdı.`,
    `${input.genre} türündeki bu yolculukta ${input.characterName}, cesaretini ve merakını kullanarak karşısına çıkan ipuçlarını takip etti. Ortam ${input.tone.toLowerCase()} bir havaya bürünürken, hikâyenin gizemi yavaş yavaş açığa çıktı.`,
    `Sonunda ${input.characterName}, aradığı cevabın yalnızca dışarıda değil, kendi kararlılığında da saklı olduğunu anladı. ${input.visualStyle} tarzında canlandırılabilecek bu final, izleyiciye umut veren sıcak bir kapanış sundu.`,
  ];

  return {
    title,
    synopsis: `${input.characterName}, ${input.place} içinde başlayan ${input.genre.toLowerCase()} türündeki bir yolculukta kendi cesaretini keşfeder.`,
    content: paragraphs.join("\n\n"),
    paragraphs,
    scenes: [
      {
        title: "Başlangıç",
        description: `${input.characterName}, ${input.place} içinde hikâyenin ana gizemiyle karşılaşır.`,
        prompt: `${input.visualStyle} tarzında, ${input.place} içinde duran ${input.characterName}, ${input.tone.toLowerCase()} atmosfer, sinematik kompozisyon, detaylı ışıklandırma`,
        mood: input.tone,
      },
      {
        title: "Yolculuk",
        description: `${input.characterName}, ipuçlarını takip ederek hikâyenin merkezindeki problemi çözmeye yaklaşır.`,
        prompt: `${input.visualStyle} tarzında, ${input.characterName} gizemli bir yolu takip ediyor, ${input.genre.toLowerCase()} atmosfer, dinamik kamera açısı`,
        mood: "Meraklı",
      },
      {
        title: "Final",
        description: `${input.characterName}, yolculuğun sonunda hikâyenin ana mesajını keşfeder.`,
        prompt: `${input.visualStyle} tarzında, umutlu final sahnesi, ${input.characterName} güçlü ve kararlı görünüyor, sıcak ışık, sinematik final`,
        mood: "Umutlu",
      },
    ],
  };
};

const normalizeAiStory = (aiStory, input) => {
  const title = normalizeText(aiStory.title, input.title || "Başlıksız Hikâye");
  const content = normalizeText(aiStory.content, "");

  if (!content) {
    throw new Error("AI hikaye yaniti content alanini icermeli.");
  }

  const paragraphs = Array.isArray(aiStory.paragraphs) && aiStory.paragraphs.length > 0
    ? aiStory.paragraphs.map((paragraph) => normalizeText(paragraph)).filter(Boolean)
    : splitParagraphs(content);

  const scenes = Array.isArray(aiStory.scenes)
    ? aiStory.scenes.slice(0, 3).map((scene, index) => ({
        title: normalizeText(scene.title, `Sahne ${index + 1}`),
        description: normalizeText(scene.description, `Hikâyenin ${index + 1}. sahnesi.`),
        prompt: normalizeText(
          scene.prompt,
          `${input.visualStyle} tarzında ${input.genre} hikâye sahnesi, ${input.characterName}`
        ),
        mood: normalizeText(scene.mood, input.tone),
      }))
    : [];

  while (scenes.length < 3) {
    const fallback = buildFallbackStory(input).scenes[scenes.length];
    scenes.push(fallback);
  }

  return {
    title,
    synopsis: normalizeText(aiStory.synopsis, `${title} için kısa hikâye özeti.`),
    content,
    paragraphs,
    scenes,
  };
};

const normalizeCreateInput = (input = {}) => {
  return {
    title: normalizeText(input.title),
    idea: normalizeText(input.idea || input.topic, "Kısa bir macera hikâyesi"),
    characterName: normalizeText(input.character || input.characterName, "Mira"),
    place: normalizeText(input.place, "eski bir sahil kasabası"),
    genre: normalizeText(input.genre, "Macera"),
    tone: normalizeText(input.tone, "Sinematik"),
    visualStyle: normalizeText(input.visualStyle || input.visual_style, "3D Animasyon"),
    length: normalizeLength(input.duration || input.length),
    narrator: normalizeText(input.narrator, "Anlatıcı"),
  };
};

const createStory = async (input) => {
  const normalizedInput = normalizeCreateInput(input);

  let generatedStory;
  let generatedPrompt = buildStorySystemPrompt(normalizedInput);

  try {
    const aiStory = await generateStructuredText({
      systemPrompt: generatedPrompt,
      userPrompt: normalizedInput.idea,
      schemaName: '"title", "synopsis", "content", "paragraphs", "scenes"',
    });

    generatedStory = normalizeAiStory(aiStory, normalizedInput);
  } catch (error) {
    console.warn("AI hikaye uretimi basarisiz oldu, fallback hikaye kullaniliyor:", error.message);
    generatedStory = buildFallbackStory(normalizedInput);
    generatedPrompt = `${generatedPrompt}\n\nNOT: AI yaniti alinamadigi icin gelistirme fallback metni kullanildi.`;
  }

  return storyRepository.createStory({
    title: generatedStory.title,
    idea: normalizedInput.idea,
    generatedPrompt,
    content: generatedStory.content,
    paragraphs: generatedStory.paragraphs,
    synopsis: generatedStory.synopsis,
    genre: normalizedInput.genre,
    tone: normalizedInput.tone,
    visualStyle: normalizedInput.visualStyle,
    characterName: normalizedInput.characterName,
    place: normalizedInput.place,
    narrator: normalizedInput.narrator,
    mediaStatus: {
      images: "pending",
      audio: "pending",
      video: "pending",
      subtitles: "pending",
    },
    targetSceneCount: 3,
    status: "ready",
    scenes: generatedStory.scenes,
  });
};

const getStories = () => {
  return storyRepository.listStories();
};

const getStoryById = async (storyId) => {
  const story = await storyRepository.getStoryById(storyId);

  if (!story) {
    const error = new Error("Hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  return story;
};

const deleteStory = async (storyId) => {
  const isDeleted = await storyRepository.deleteStory(storyId);

  if (!isDeleted) {
    const error = new Error("Silinecek hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  return {
    id: storyId,
    deleted: true,
  };
};

module.exports = {
  createStory,
  getStories,
  getStoryById,
  deleteStory,
};