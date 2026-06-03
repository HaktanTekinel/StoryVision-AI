const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const storyRepository = require("../repositories/storyRepository");
const videoRepository = require("../repositories/videoRepository");
const { env } = require("../config/env");

const backendRoot = path.join(__dirname, "../..");
const subtitleUploadDir = path.join(backendRoot, "uploads", "subtitles");
const videoUploadDir = path.join(backendRoot, "uploads", "videos");

const SUBTITLE_FONT_NAME = "Arial";
const SUBTITLE_FONT_SIZE = 24;
const SUBTITLE_OUTLINE = 2;
const SUBTITLE_SHADOW = 1;
const SUBTITLE_MARGIN_V = 42;
const SUBTITLE_MARGIN_L = 50;
const SUBTITLE_MARGIN_R = 50;

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
  await fs.mkdir(videoUploadDir, { recursive: true });
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

const wrapSubtitleLine = (text, maxLineLength = 48) => {
  const words = cleanText(text).split(" ").filter(Boolean);
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;

    if (next.length > maxLineLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 2).join("\n");
};

const escapeAssText = (text) => {
  return wrapSubtitleLine(text)
    .replace(/\\/g, "\\\\")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/\n/g, "\\N");
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

const formatSrtTime = (seconds) => {
  return formatVttTime(seconds).replace(".", ",");
};

const formatAssTime = (seconds) => {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = Math.floor(safeSeconds % 60);
  const centiseconds = Math.floor(
    (safeSeconds - Math.floor(safeSeconds)) * 100
  );

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(
    2,
    "0"
  )}.${String(centiseconds).padStart(2, "0")}`;
};

const buildWeightedSubtitleTimings = ({ chunks, totalDuration }) => {
  const duration = Math.max(3, Number(totalDuration) || chunks.length * 5);

  const weights = chunks.map((chunk) => {
    const textLength = cleanText(chunk).length;
    return Math.max(20, textLength);
  });

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  let cursor = 0;

  return chunks.map((chunk, index) => {
    const isLast = index === chunks.length - 1;
    const rawDuration = duration * (weights[index] / totalWeight);
    const cueDuration = Math.max(1.8, rawDuration);
    const start = cursor;
    const end = isLast ? duration : Math.min(duration, start + cueDuration);

    cursor = end;

    return {
      index: index + 1,
      start,
      end,
      text: chunk,
    };
  });
};

const buildVttContent = ({ cues }) => {
  const lines = cues.map((cue) => {
    return `${formatVttTime(cue.start)} --> ${formatVttTime(cue.end)}\n${cue.text}`;
  });

  return `WEBVTT\n\n${lines.join("\n\n")}\n`;
};

const buildSrtContent = ({ cues }) => {
  const lines = cues.map((cue) => {
    return `${cue.index}\n${formatSrtTime(cue.start)} --> ${formatSrtTime(
      cue.end
    )}\n${cue.text}`;
  });

  return `${lines.join("\n\n")}\n`;
};

const buildAssContent = ({ cues }) => {
  const dialogueLines = cues.map((cue) => {
    return `Dialogue: 0,${formatAssTime(cue.start)},${formatAssTime(
      cue.end
    )},Default,,0,0,0,,${escapeAssText(cue.text)}`;
  });

  return `[Script Info]
Title: StoryVision AI Subtitles
ScriptType: v4.00+
WrapStyle: 2
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${SUBTITLE_FONT_NAME},${SUBTITLE_FONT_SIZE},&H00FFFFFF,&H000000FF,&H00000000,&H99000000,-1,0,0,0,100,100,0,0,1,${SUBTITLE_OUTLINE},${SUBTITLE_SHADOW},2,${SUBTITLE_MARGIN_L},${SUBTITLE_MARGIN_R},${SUBTITLE_MARGIN_V},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
${dialogueLines.join("\n")}
`;
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

const getBestDurationForSubtitles = async (story) => {
  const audioPath = story.audioPath || story.audio_path;
  const videoPath = story.videoPath || story.video_path;

  if (audioPath) {
    const absoluteAudioPath = toAbsoluteBackendPath(audioPath);

    try {
      return await getMediaDurationSeconds(absoluteAudioPath);
    } catch (error) {
      console.warn(
        "Ses dosyasi suresi okunamadi, video suresi deneniyor:",
        error.message
      );
    }
  }

  if (videoPath) {
    const absoluteVideoPath = toAbsoluteBackendPath(videoPath);

    try {
      return await getMediaDurationSeconds(absoluteVideoPath);
    } catch (error) {
      console.warn(
        "Video dosyasi suresi okunamadi, kayitli tahmini sure deneniyor:",
        error.message
      );
    }
  }

  return Number(story.audioDurationSeconds || 0) || 0;
};

const burnSubtitlesIntoVideo = async ({
  story,
  absoluteVideoPath,
  absoluteAssPath,
}) => {
  await ensureFolders();

  await assertFileExists(
    absoluteVideoPath,
    "Altyazi gomulecek video dosyasi bulunamadi."
  );

  await assertFileExists(
    absoluteAssPath,
    "Videoya gomulecek ASS altyazi dosyasi bulunamadi."
  );

  const ffmpegPath = getFfmpegPath();
  const uniqueSuffix = Date.now();

  const tempDir = path.join(
    subtitleUploadDir,
    `burn-${story.id}-${uniqueSuffix}`
  );

  await fs.mkdir(tempDir, { recursive: true });

  const tempVideoPath = path.join(tempDir, "input.mp4");
  const tempAssPath = path.join(tempDir, "subtitle.ass");
  const tempOutputPath = path.join(tempDir, "output.mp4");

  const finalFileName = `${story.id}-${slugify(
    story.title
  )}-${uniqueSuffix}-altyazili-video.mp4`;

  const finalAbsoluteVideoPath = path.join(videoUploadDir, finalFileName);
  const finalRelativeVideoPath = `/uploads/videos/${finalFileName}`;
  const finalPublicVideoUrl = `${getPublicBaseUrl()}${finalRelativeVideoPath}`;

  await fs.copyFile(absoluteVideoPath, tempVideoPath);
  await fs.copyFile(absoluteAssPath, tempAssPath);

  try {
    await runCommand(
      ffmpegPath,
      [
        "-y",
        "-i",
        "input.mp4",
        "-vf",
        "ass=subtitle.ass",
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "copy",
        "-movflags",
        "+faststart",
        "output.mp4",
      ],
      {
        cwd: tempDir,
      }
    );

    await fs.copyFile(tempOutputPath, finalAbsoluteVideoPath);
  } finally {
    await fs.rm(tempDir, {
      recursive: true,
      force: true,
    });
  }

  return {
    videoUrl: finalPublicVideoUrl,
    videoPath: finalRelativeVideoPath,
    absoluteVideoPath: finalAbsoluteVideoPath,
  };
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
    const error = new Error(
      "Hikaye metni bos oldugu icin altyazi olusturulamadi."
    );
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await ensureFolders();

  const chunks = splitIntoSubtitleChunks(text);
  const totalDuration = await getBestDurationForSubtitles(story);

  const cues = buildWeightedSubtitleTimings({
    chunks,
    totalDuration,
  });

  const baseFileName = `${story.id}-${slugify(story.title)}-altyazi`;

  const vttFileName = `${baseFileName}.vtt`;
  const srtFileName = `${baseFileName}.srt`;
  const assFileName = `${baseFileName}.ass`;

  const absoluteVttPath = path.join(subtitleUploadDir, vttFileName);
  const absoluteSrtPath = path.join(subtitleUploadDir, srtFileName);
  const absoluteAssPath = path.join(subtitleUploadDir, assFileName);

  const relativeVttPath = `/uploads/subtitles/${vttFileName}`;
  const relativeSrtPath = `/uploads/subtitles/${srtFileName}`;
  const relativeAssPath = `/uploads/subtitles/${assFileName}`;

  const publicVttUrl = `${getPublicBaseUrl()}${relativeVttPath}`;
  const publicSrtUrl = `${getPublicBaseUrl()}${relativeSrtPath}`;
  const publicAssUrl = `${getPublicBaseUrl()}${relativeAssPath}`;

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
    await fs.writeFile(
      absoluteVttPath,
      buildVttContent({
        cues,
      }),
      "utf8"
    );

    await fs.writeFile(
      absoluteSrtPath,
      buildSrtContent({
        cues,
      }),
      "utf8"
    );

    await fs.writeFile(
      absoluteAssPath,
      buildAssContent({
        cues,
      }),
      "utf8"
    );

    await videoRepository.updateStoryVideoSubtitles({
      storyId,
      subtitleUrl: publicVttUrl,
      subtitlePath: relativeVttPath,
    });

    let embeddedVideo = null;

    const existingVideoPath = story.videoPath || story.video_path;

    if (existingVideoPath) {
      const absoluteExistingVideoPath = toAbsoluteBackendPath(existingVideoPath);

      embeddedVideo = await burnSubtitlesIntoVideo({
        story,
        absoluteVideoPath: absoluteExistingVideoPath,
        absoluteAssPath,
      });

      await videoRepository.upsertStoryVideo({
        storyId,
        videoUrl: embeddedVideo.videoUrl,
        videoPath: embeddedVideo.videoPath,
        transitionEffect: story.transitionEffect || "fade",
        status: "ready",
      });
    } else {
      console.warn(
        "Altyazi dosyasi olusturuldu ancak video henuz olusmadigi icin videoya gomulemedi. Once video olusturup sonra altyazi olusturma adimini tekrar calistir."
      );
    }

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
      subtitleUrl: publicVttUrl,
      subtitlePath: relativeVttPath,
      srtUrl: publicSrtUrl,
      srtPath: relativeSrtPath,
      assUrl: publicAssUrl,
      assPath: relativeAssPath,
      format: "vtt+srt+ass",
      cueCount: chunks.length,
      durationSeconds: totalDuration,
      embedded: Boolean(embeddedVideo),
      embeddedVideoUrl: embeddedVideo?.videoUrl || null,
      embeddedVideoPath: embeddedVideo?.videoPath || null,
      message: embeddedVideo
        ? "Altyazi ses suresine gore olusturuldu ve videoya kalici olarak gomuldu."
        : "Altyazi ses suresine gore olusturuldu. Videoya gommek icin once video olusturup altyazi adimini tekrar calistir.",
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