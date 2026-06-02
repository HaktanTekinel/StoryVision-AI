const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const storyRepository = require("../repositories/storyRepository");
const videoRepository = require("../repositories/videoRepository");
const { env } = require("../config/env");

const backendRoot = path.join(__dirname, "../..");
const videoUploadDir = path.join(backendRoot, "uploads", "videos");

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
      .slice(0, 60) || "video"
  );
};

const toAbsoluteBackendPath = (relativePath) => {
  const cleanPath = String(relativePath || "").replace(/^\/+/, "");
  return path.join(backendRoot, cleanPath);
};

const runCommand = (file, args) => {
  return new Promise((resolve, reject) => {
    execFile(file, args, { windowsHide: true }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(stderr || stdout || error.message));
        return;
      }

      resolve({ stdout, stderr });
    });
  });
};

const ensureFolders = async () => {
  await fs.mkdir(videoUploadDir, { recursive: true });
};

const assertFileExists = async (filePath, errorMessage) => {
  try {
    await fs.access(filePath);
  } catch {
    const error = new Error(errorMessage);
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }
};

const getReadySceneImages = (story) => {
  return (story.scenes || [])
    .filter((scene) => scene.imagePath || scene.image_path)
    .slice(0, 3);
};

const buildVideoFilter = ({ sceneCount, sceneDuration, transitionDuration }) => {
  const filters = [];

  for (let index = 0; index < sceneCount; index += 1) {
    filters.push(
      `[${index}:v]scale=1280:720:force_original_aspect_ratio=decrease,` +
        `pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,format=rgba,setpts=PTS-STARTPTS[v${index}]`
    );
  }

  if (sceneCount === 1) {
    filters.push("[v0]format=yuv420p[vout]");
    return filters.join(";");
  }

  const firstOffset = Math.max(1, sceneDuration - transitionDuration);

  filters.push(
    `[v0][v1]xfade=transition=fade:duration=${transitionDuration}:offset=${firstOffset}[x1]`
  );

  if (sceneCount === 2) {
    filters.push("[x1]format=yuv420p[vout]");
    return filters.join(";");
  }

  const secondOffset = Math.max(
    firstOffset + 1,
    sceneDuration * 2 - transitionDuration * 2
  );

  filters.push(
    `[x1][v2]xfade=transition=fade:duration=${transitionDuration}:offset=${secondOffset},format=yuv420p[vout]`
  );

  return filters.join(";");
};

const createFallbackVideo = async ({ audioPath, outputPath, totalDuration }) => {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

  await runCommand(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x111827:s=1280x720:d=${totalDuration}`,
    "-i",
    audioPath,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-shortest",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    outputPath,
  ]);
};

const createVideoWithImages = async ({
  imagePaths,
  audioPath,
  outputPath,
  sceneDuration,
}) => {
  const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";
  const transitionDuration = 1;
  const args = [];

  imagePaths.forEach((imagePath) => {
    args.push("-loop", "1", "-t", String(sceneDuration), "-i", imagePath);
  });

  args.push("-i", audioPath);

  const audioInputIndex = imagePaths.length;
  const filterComplex = buildVideoFilter({
    sceneCount: imagePaths.length,
    sceneDuration,
    transitionDuration,
  });

  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "[vout]",
    "-map",
    `${audioInputIndex}:a`,
    "-shortest",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    outputPath
  );

  await runCommand(ffmpegPath, ["-y", ...args]);
};

async function generateStoryVideo(storyId) {
  const story = await storyRepository.getStoryById(storyId);

  if (!story) {
    const error = new Error("Video olusturulacak hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const scenes = getReadySceneImages(story);

  if (scenes.length < 3) {
    const error = new Error(
      "Video olusturmak icin once en az 3 sahne gorseli olusturulmali."
    );
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  if (!story.audioPath && !story.audio_path) {
    const error = new Error(
      "Video olusturmak icin once hikaye sesi olusturulmali."
    );
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await ensureFolders();

  const audioPath = toAbsoluteBackendPath(story.audioPath || story.audio_path);
  const imagePaths = scenes.map((scene) =>
    toAbsoluteBackendPath(scene.imagePath || scene.image_path)
  );

  await assertFileExists(audioPath, "Ses dosyasi bulunamadi.");

  for (const imagePath of imagePaths) {
    await assertFileExists(imagePath, "Sahne gorsel dosyasi bulunamadi.");
  }

  const durationFromAudio = Number(story.audioDurationSeconds || 0);
  const sceneDuration = Math.max(
    4,
    Math.ceil((durationFromAudio || 18) / scenes.length)
  );
  const totalDuration = sceneDuration * scenes.length;

  const fileName = `${story.id}-${slugify(story.title)}-video.mp4`;
  const absoluteVideoPath = path.join(videoUploadDir, fileName);
  const relativeVideoPath = `/uploads/videos/${fileName}`;
  const publicVideoUrl = `${getPublicBaseUrl()}${relativeVideoPath}`;

  await storyRepository.upsertMediaJob({
    storyId,
    type: "video",
    status: "processing",
  });

  await storyRepository.updateStoryMediaStatus({
    storyId,
    type: "video",
    status: "processing",
  });

  await videoRepository.upsertStoryVideo({
    storyId,
    videoUrl: null,
    videoPath: null,
    transitionEffect: "fade",
    status: "processing",
  });

  try {
    try {
      await createVideoWithImages({
        imagePaths,
        audioPath,
        outputPath: absoluteVideoPath,
        sceneDuration,
      });
    } catch (videoError) {
      console.warn(
        "Gorsel tabanli video olusturma basarisiz oldu, basit video fallback kullaniliyor:",
        videoError.message
      );

      await createFallbackVideo({
        audioPath,
        outputPath: absoluteVideoPath,
        totalDuration,
      });
    }

    await videoRepository.upsertStoryVideo({
      storyId,
      videoUrl: publicVideoUrl,
      videoPath: relativeVideoPath,
      transitionEffect: "fade",
      status: "ready",
    });

    await storyRepository.upsertMediaJob({
      storyId,
      type: "video",
      status: "ready",
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "video",
      status: "ready",
    });

    return {
      storyId,
      status: "ready",
      videoUrl: publicVideoUrl,
      videoPath: relativeVideoPath,
      transitionEffect: "fade",
      sceneCount: scenes.length,
      sceneDuration,
    };
  } catch (error) {
    await videoRepository.upsertStoryVideo({
      storyId,
      videoUrl: null,
      videoPath: null,
      transitionEffect: "fade",
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.upsertMediaJob({
      storyId,
      type: "video",
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "video",
      status: "failed",
    });

    throw error;
  }
}

module.exports = {
  generateStoryVideo,
};