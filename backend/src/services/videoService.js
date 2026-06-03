const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const storyRepository = require("../repositories/storyRepository");
const videoRepository = require("../repositories/videoRepository");
const { env } = require("../config/env");

const backendRoot = path.join(__dirname, "../..");
const videoUploadDir = path.join(backendRoot, "uploads", "videos");

const VIDEO_WIDTH = 1280;
const VIDEO_HEIGHT = 720;
const VIDEO_FPS = 25;
const TRANSITION_DURATION = 1;

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

const runCommand = (file, args, options = {}) => {
  return new Promise((resolve, reject) => {
    execFile(
      file,
      args,
      {
        windowsHide: true,
        ...options,
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(stderr || stdout || error.message));
          return;
        }

        resolve({ stdout, stderr });
      }
    );
  });
};

const getFfmpegPath = () => {
  return process.env.FFMPEG_PATH || env.ffmpegPath || "ffmpeg";
};

const getFfprobePath = () => {
  const ffmpegPath = getFfmpegPath();

  if (ffmpegPath === "ffmpeg") {
    return "ffprobe";
  }

  const parsedPath = path.parse(ffmpegPath);
  const extension = parsedPath.ext || ".exe";

  return path.join(parsedPath.dir, `ffprobe${extension}`);
};

const getMediaDurationSeconds = async (filePath) => {
  const ffprobePath = getFfprobePath();

  const { stdout } = await runCommand(ffprobePath, [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    filePath,
  ]);

  const duration = Number.parseFloat(String(stdout).trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new Error(`Medya suresi okunamadi: ${filePath}`);
  }

  return duration;
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

const getSceneDuration = ({ totalDuration, sceneCount }) => {
  if (sceneCount <= 1) {
    return totalDuration;
  }

  return (totalDuration + TRANSITION_DURATION * (sceneCount - 1)) / sceneCount;
};

const buildVideoFilter = ({ sceneCount, sceneDuration, totalDuration }) => {
  const filters = [];

  for (let index = 0; index < sceneCount; index += 1) {
    filters.push(
      `[${index}:v]scale=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:force_original_aspect_ratio=decrease,` +
        `pad=${VIDEO_WIDTH}:${VIDEO_HEIGHT}:(ow-iw)/2:(oh-ih)/2,` +
        `setsar=1,fps=${VIDEO_FPS},format=rgba,setpts=PTS-STARTPTS[v${index}]`
    );
  }

  if (sceneCount === 1) {
    filters.push(
      `[v0]tpad=stop_mode=clone:stop_duration=3,trim=duration=${totalDuration.toFixed(
        3
      )},format=yuv420p[vout]`
    );

    return filters.join(";");
  }

  let previousLabel = "v0";

  for (let index = 1; index < sceneCount; index += 1) {
    const outputLabel = index === sceneCount - 1 ? "vxfade" : `x${index}`;
    const offset = Math.max(
      0.1,
      index * sceneDuration - index * TRANSITION_DURATION
    );

    filters.push(
      `[${previousLabel}][v${index}]xfade=transition=fade:duration=${TRANSITION_DURATION}:offset=${offset.toFixed(
        3
      )}[${outputLabel}]`
    );

    previousLabel = outputLabel;
  }

  filters.push(
    `[${previousLabel}]tpad=stop_mode=clone:stop_duration=3,trim=duration=${totalDuration.toFixed(
      3
    )},format=yuv420p[vout]`
  );

  return filters.join(";");
};

const createFallbackVideo = async ({ audioPath, outputPath, totalDuration }) => {
  const ffmpegPath = getFfmpegPath();

  await runCommand(ffmpegPath, [
    "-y",
    "-f",
    "lavfi",
    "-i",
    `color=c=0x111827:s=${VIDEO_WIDTH}x${VIDEO_HEIGHT}:r=${VIDEO_FPS}:d=${totalDuration.toFixed(
      3
    )}`,
    "-i",
    audioPath,
    "-map",
    "0:v",
    "-map",
    "1:a",
    "-t",
    totalDuration.toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
};

const createVideoWithImages = async ({
  imagePaths,
  audioPath,
  outputPath,
  sceneDuration,
  totalDuration,
}) => {
  const ffmpegPath = getFfmpegPath();
  const args = [];

  imagePaths.forEach((imagePath) => {
    args.push("-loop", "1", "-t", sceneDuration.toFixed(3), "-i", imagePath);
  });

  args.push("-i", audioPath);

  const audioInputIndex = imagePaths.length;

  const filterComplex = buildVideoFilter({
    sceneCount: imagePaths.length,
    sceneDuration,
    totalDuration,
  });

  args.push(
    "-filter_complex",
    filterComplex,
    "-map",
    "[vout]",
    "-map",
    `${audioInputIndex}:a`,
    "-t",
    totalDuration.toFixed(3),
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-pix_fmt",
    "yuv420p",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
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

  const realAudioDuration = await getMediaDurationSeconds(audioPath);
  const totalDuration = Math.max(3, realAudioDuration);
  const sceneDuration = getSceneDuration({
    totalDuration,
    sceneCount: scenes.length,
  });

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
        totalDuration,
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
      audioDurationSeconds: totalDuration,
      videoDurationSeconds: totalDuration,
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