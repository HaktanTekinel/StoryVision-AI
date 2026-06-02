const fs = require("fs/promises");
const path = require("path");
const storyRepository = require("../repositories/storyRepository");
const videoRepository = require("../repositories/videoRepository");
const { env } = require("../config/env");

const backendRoot = path.join(__dirname, "../..");
const subtitleUploadDir = path.join(backendRoot, "uploads", "subtitles");

const getPublicBaseUrl = () => {
  return process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${env.port}`;
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
      .slice(0, 60) || "altyazi"
  );
};

const ensureFolders = async () => {
  await fs.mkdir(subtitleUploadDir, { recursive: true });
};

const cleanText = (value) => {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const splitIntoSubtitleChunks = (text, maxLength = 90) => {
  const sentences = cleanText(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const chunks = [];
  let current = "";

  sentences.forEach((sentence) => {
    const next = current ? `${current} ${sentence}` : sentence;

    if (next.length > maxLength && current) {
      chunks.push(current);
      current = sentence;
    } else {
      current = next;
    }
  });

  if (current) {
    chunks.push(current);
  }

  if (chunks.length === 0 && text) {
    chunks.push(cleanText(text));
  }

  return chunks;
};

const formatVttTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const millis = Math.floor((safeSeconds - Math.floor(safeSeconds)) * 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
};

const buildVttContent = ({ chunks, totalDuration }) => {
  const duration = Math.max(12, Number(totalDuration) || chunks.length * 5);
  const chunkDuration = Math.max(3, duration / Math.max(1, chunks.length));

  const cues = chunks.map((chunk, index) => {
    const start = index * chunkDuration;
    const end = Math.min(duration, start + chunkDuration);

    return `${formatVttTime(start)} --> ${formatVttTime(end)}\n${chunk}`;
  });

  return `WEBVTT\n\n${cues.join("\n\n")}\n`;
};

const generateStorySubtitles = async (storyId) => {
  const story = await storyRepository.getStoryById(storyId);

  if (!story) {
    const error = new Error("Altyazi olusturulacak hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const text = cleanText(story.content || story.text);

  if (!text) {
    const error = new Error("Hikaye metni bos oldugu icin altyazi olusturulamadi.");
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await ensureFolders();

  const chunks = splitIntoSubtitleChunks(text);
  const totalDuration = Number(story.audioDurationSeconds || 0) || chunks.length * 5;

  const fileName = `${story.id}-${slugify(story.title)}-altyazi.vtt`;
  const absoluteSubtitlePath = path.join(subtitleUploadDir, fileName);
  const relativeSubtitlePath = `/uploads/subtitles/${fileName}`;
  const publicSubtitleUrl = `${getPublicBaseUrl()}${relativeSubtitlePath}`;

  await storyRepository.upsertMediaJob({
    storyId,
    type: "subtitles",
    status: "processing",
  });

  await storyRepository.updateStoryMediaStatus({
    storyId,
    type: "subtitles",
    status: "processing",
  });

  try {
    const vttContent = buildVttContent({
      chunks,
      totalDuration,
    });

    await fs.writeFile(absoluteSubtitlePath, vttContent, "utf8");

    await videoRepository.updateStoryVideoSubtitles({
      storyId,
      subtitleUrl: publicSubtitleUrl,
      subtitlePath: relativeSubtitlePath,
    });

    await storyRepository.upsertMediaJob({
      storyId,
      type: "subtitles",
      status: "ready",
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "subtitles",
      status: "ready",
    });

    return {
      storyId,
      status: "ready",
      subtitleUrl: publicSubtitleUrl,
      subtitlePath: relativeSubtitlePath,
      format: "vtt",
      cueCount: chunks.length,
    };
  } catch (error) {
    await storyRepository.upsertMediaJob({
      storyId,
      type: "subtitles",
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "subtitles",
      status: "failed",
    });

    throw error;
  }
};

module.exports = {
  generateStorySubtitles,
};