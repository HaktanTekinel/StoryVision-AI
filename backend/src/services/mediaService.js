const fs = require("fs/promises");
const path = require("path");
const storyRepository = require("../repositories/storyRepository");
const { env } = require("../config/env");
const { delay, buildQueuedAssetResponse } = require("./demoHelpers");

const uploadRoot = path.join(__dirname, "../../uploads");
const imageUploadDir = path.join(uploadRoot, "images");

const escapeXml = (value) => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
};

const slugify = (value) => {
  return (
    String(value ?? "")
      .toLowerCase()
      .replaceAll("ı", "i")
      .replaceAll("ğ", "g")
      .replaceAll("ü", "u")
      .replaceAll("ş", "s")
      .replaceAll("ö", "o")
      .replaceAll("ç", "c")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "scene"
  );
};

const splitTextLines = (value, maxLength = 52) => {
  const words = String(value ?? "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 7);
};

const getPublicBaseUrl = () => {
  return process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${env.port}`;
};

const buildSceneSvg = ({ story, scene }) => {
  const title = escapeXml(scene.title || `Sahne ${scene.sceneOrder}`);
  const mood = escapeXml(scene.mood || story.tone || "Sinematik");
  const style = escapeXml(story.visualStyle || "Cinematic");
  const storyTitle = escapeXml(story.title || "StoryVision AI");
  const promptLines = splitTextLines(scene.prompt || scene.description || "", 54);

  const renderedPrompt = promptLines
    .map((line, index) => {
      const y = 445 + index * 32;
      return `<text x="82" y="${y}" font-size="23" fill="#f8fafc" font-family="Arial, sans-serif">${escapeXml(
        line
      )}</text>`;
    })
    .join("\n");

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020617"/>
      <stop offset="45%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#facc15" stop-opacity="0.42"/>
      <stop offset="55%" stop-color="#38bdf8" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#glow)"/>

  <circle cx="1040" cy="132" r="122" fill="#facc15" opacity="0.18"/>
  <circle cx="218" cy="590" r="175" fill="#38bdf8" opacity="0.13"/>
  <circle cx="1010" cy="620" r="210" fill="#a855f7" opacity="0.10"/>

  <path d="M0 620 C210 520, 370 700, 610 585 C820 485, 980 600, 1280 500 L1280 720 L0 720 Z" fill="#020617" opacity="0.58"/>

  <rect x="58" y="58" width="1164" height="604" rx="34" fill="#020617" opacity="0.54"/>
  <rect x="74" y="74" width="1132" height="572" rx="26" fill="none" stroke="#e0f2fe" stroke-width="2" opacity="0.25"/>

  <text x="82" y="126" font-size="24" fill="#93c5fd" font-family="Arial, sans-serif">STORYVISION AI</text>
  <text x="82" y="172" font-size="27" fill="#c4b5fd" font-family="Arial, sans-serif">${storyTitle}</text>

  <text x="82" y="245" font-size="55" font-weight="700" fill="#ffffff" font-family="Arial, sans-serif">${title}</text>
  <text x="82" y="305" font-size="30" fill="#fde68a" font-family="Arial, sans-serif">Ruh hali: ${mood}</text>
  <text x="82" y="352" font-size="28" fill="#bae6fd" font-family="Arial, sans-serif">Görsel tarz: ${style}</text>

  <text x="82" y="405" font-size="25" fill="#cbd5e1" font-family="Arial, sans-serif">Sahne promptu:</text>
  ${renderedPrompt}

  <text x="1070" y="610" text-anchor="middle" font-size="118" fill="#ffffff" opacity="0.12" font-family="Arial, sans-serif">${scene.sceneOrder || scene.order || ""}</text>
</svg>
`.trim();
};

const ensureUploadFolders = async () => {
  await fs.mkdir(imageUploadDir, { recursive: true });
};

const createSceneImageFile = async ({ story, scene }) => {
  await ensureUploadFolders();

  const fileName = `${story.id}-${scene.sceneOrder}-${slugify(scene.title)}.svg`;
  const absolutePath = path.join(imageUploadDir, fileName);
  const relativePath = `/uploads/images/${fileName}`;
  const publicUrl = `${getPublicBaseUrl()}${relativePath}`;

  const svg = buildSceneSvg({ story, scene });

  await fs.writeFile(absolutePath, svg, "utf8");

  return {
    imageUrl: publicUrl,
    imagePath: relativePath,
  };
};

const generateStoryImages = async (storyId) => {
  const story = await storyRepository.getStoryById(storyId);

  if (!story) {
    const error = new Error("Gorsel uretilecek hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  if (!Array.isArray(story.scenes) || story.scenes.length < 3) {
    const error = new Error("Hikayede en az 3 sahne bulunmali.");
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await storyRepository.upsertMediaJob({
    storyId,
    type: "images",
    status: "processing",
  });

  await storyRepository.updateStoryMediaStatus({
    storyId,
    type: "images",
    status: "processing",
  });

  try {
    const updatedScenes = [];

    for (const scene of story.scenes.slice(0, 3)) {
      const image = await createSceneImageFile({ story, scene });

      const updatedScene = await storyRepository.updateSceneImage({
        sceneId: scene.id,
        imageUrl: image.imageUrl,
        imagePath: image.imagePath,
      });

      updatedScenes.push(updatedScene);
    }

    await storyRepository.upsertMediaJob({
      storyId,
      type: "images",
      status: "ready",
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "images",
      status: "ready",
    });

    return {
      storyId,
      status: "ready",
      count: updatedScenes.length,
      images: updatedScenes,
    };
  } catch (error) {
    await storyRepository.upsertMediaJob({
      storyId,
      type: "images",
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "images",
      status: "failed",
    });

    throw error;
  }
};

const getDemoImage = async ({ topic, genre }) => {
  await delay(1200);

  return buildQueuedAssetResponse({
    assetType: "image",
    description: `${genre} tarzi, ${topic} temali bir gorsel icin demo istek olusturuldu.`,
  });
};

const getDemoAudio = async ({ topic, character }) => {
  await delay(1200);

  return buildQueuedAssetResponse({
    assetType: "audio",
    description: `${character} karakteri icin ${topic} odakli bir ses kaydi demo olarak hazirlandi.`,
  });
};

const getDemoVideo = async ({ topic, genre, length }) => {
  await delay(1200);

  return buildQueuedAssetResponse({
    assetType: "video",
    description: `${genre} turunde, ${topic} temasini isleyen ve ${length} uzunlugunda bir video akisi demo olarak hazirlandi.`,
  });
};

module.exports = {
  generateStoryImages,
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};