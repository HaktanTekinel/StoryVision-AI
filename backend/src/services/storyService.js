const { buildStoryPromptPayload } = require("../utils/promptBuilder");

// Demo hikaye metni icin baslik olusturur
const buildDemoTitle = ({ topic, genre }) => {
  return `${genre} Hikayesi: ${topic}`;
};

// Demo hikaye metni icin icerik olusturur
const buildDemoContent = ({ topic, character, genre, length }) => {
  const intro = `${character}, ${topic} ile ilgili beklenmedik bir yolculuga cikti.`;
  const middle = `Yol boyunca ${genre} atmosferi giderek belirginlesti ve her adim yeni bir sirri ortaya cikardi.`;
  const ending = `Uzunluk seviyesi ${length} olarak planlanan bu hikaye, ${character} icin unutulmaz bir sonla tamamlandi.`;

  return `${intro} ${middle} ${ending}`;
};

// Hikaye demo verisini hazirlar
const getDemoStory = async ({ topic, character, genre, length }) => {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const promptPayload = buildStoryPromptPayload({
    topic,
    character,
    genre,
    length,
  });

  return {
    title: buildDemoTitle({ topic, genre }),
    content: buildDemoContent({ topic, character, genre, length }),
    prompt: promptPayload,
  };
};

module.exports = {
  getDemoStory,
};
