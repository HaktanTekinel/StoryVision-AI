const fs = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");
const storyRepository = require("../repositories/storyRepository");
const { env } = require("../config/env");
const { delay, buildQueuedAssetResponse } = require("./demoHelpers");

const uploadRoot = path.join(__dirname, "../../uploads");
const imageUploadDir = path.join(uploadRoot, "images");
const audioUploadDir = path.join(uploadRoot, "audio");

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
      .slice(0, 60) || "story"
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
  return env.publicBaseUrl || process.env.PUBLIC_BASE_URL || `http://127.0.0.1:${env.port}`;
};

const estimateDurationSeconds = (text) => {
  const wordCount = String(text || "").split(/\s+/).filter(Boolean).length;
  return Math.max(8, Math.min(180, Math.ceil(wordCount / 2.2)));
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

const ensureUploadFolders = async () => {
  await fs.mkdir(imageUploadDir, { recursive: true });
  await fs.mkdir(audioUploadDir, { recursive: true });
};

const downloadBuffer = async (url, options = {}) => {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch bulunamadi. Node.js surumu eski olabilir.");
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Dis servis hatasi: ${response.status} ${response.statusText} ${text}`.trim()
    );
  }

  const arrayBuffer = await response.arrayBuffer();

  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: response.headers.get("content-type") || "",
  };
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

const createSceneSvgFallback = async ({ story, scene }) => {
  await ensureUploadFolders();

  const uniqueSuffix = Date.now();
  const fileName = `${story.id}-${scene.sceneOrder}-${slugify(scene.title)}-${uniqueSuffix}.svg`;
  const absolutePath = path.join(imageUploadDir, fileName);
  const relativePath = `/uploads/images/${fileName}`;
  const publicUrl = `${getPublicBaseUrl()}${relativePath}`;

  const svg = buildSceneSvg({ story, scene });

  await fs.writeFile(absolutePath, svg, "utf8");

  return {
    imageUrl: publicUrl,
    imagePath: relativePath,
    provider: "svg-fallback",
  };
};

const buildCharacterConsistencyProfile = (story) => {
  const characterName =
    story.character ||
    story.characterName ||
    story.character_name ||
    story.protagonist ||
    "the same main character";

  const characterDescription =
    story.characterDescription ||
    story.character_description ||
    story.mainCharacterDescription ||
    story.main_character_description ||
    "";

  const visualStyle =
    story.visualStyle ||
    story.visual_style ||
    "cinematic anime-inspired digital illustration";

  const profile = [
    `MAIN CHARACTER CONSISTENCY LOCK: every scene must show the exact same protagonist: ${characterName}.`,
    "The protagonist must keep the same face shape, same hairstyle, same hair color, same eye color, same age, same body type, same outfit, same accessories, same weapon if any, and same overall visual identity across all images.",
    "The character is the same person in every scene, like frames from one animated movie.",
    "Only the pose, facial expression, camera angle, lighting, and background may change.",
    "Do not redesign the protagonist between scenes.",
    `Consistent art style for the whole story: ${visualStyle}.`,
  ];

  if (characterDescription) {
    profile.push(`Fixed protagonist description: ${characterDescription}.`);
  }

  return profile.join(" ");
};

const buildHuggingFacePrompt = ({ story, scene }) => {
  const characterProfile = buildCharacterConsistencyProfile(story);

  const sceneTitle = scene.title || `Scene ${scene.sceneOrder || scene.order || ""}`;
  const sceneDescription =
    scene.prompt ||
    scene.description ||
    scene.sceneDescription ||
    "A cinematic story scene";

  const storyContext = [
    `Story title: ${story.title || "StoryVision AI story"}.`,
    `Genre: ${story.genre || "fantasy adventure"}.`,
    `Tone: ${story.tone || "dramatic and cinematic"}.`,
    `Main location: ${story.place || story.setting || "atmospheric story location"}.`,
  ].join(" ");

  const visualQuality = [
    "wide cinematic 16:9 composition",
    "professional anime movie still",
    "high quality digital illustration",
    "detailed background",
    "dramatic lighting",
    "sharp focus",
    "clean line art",
    "coherent character anatomy",
    "consistent protagonist design",
    "no text in the image",
  ].join(", ");

  return [
    characterProfile,
    storyContext,
    `CURRENT SCENE TITLE: ${sceneTitle}.`,
    `CURRENT SCENE DESCRIPTION: ${sceneDescription}.`,
    `Current scene mood: ${scene.mood || story.tone || "cinematic"}.`,
    visualQuality,
    "IMPORTANT: The protagonist must look identical across all generated story scenes. Keep the same outfit and facial features. Do not create a new character.",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 2200);
};

const buildHuggingFaceNegativePrompt = () => {
  return [
    "different character",
    "character redesign",
    "inconsistent protagonist",
    "new protagonist",
    "different face",
    "different hairstyle",
    "different hair color",
    "different eye color",
    "different outfit",
    "different age",
    "different gender",
    "multiple protagonists",
    "duplicate protagonist",
    "random character",
    "text",
    "subtitle",
    "caption",
    "watermark",
    "logo",
    "signature",
    "ui",
    "speech bubble",
    "blurry",
    "low quality",
    "bad anatomy",
    "distorted face",
    "deformed hands",
    "extra fingers",
    "missing fingers",
    "mutated body",
  ].join(", ");
};

const createSceneImageWithHuggingFace = async ({ story, scene }) => {
  await ensureUploadFolders();

  const apiToken = env.hfApiToken || process.env.HF_API_TOKEN || "";

  if (!apiToken.trim()) {
    throw new Error("HF_API_TOKEN tanimli degil. Hugging Face gorsel uretimi icin token gerekli.");
  }

  const { InferenceClient } = await import("@huggingface/inference");
  const client = new InferenceClient(apiToken);

  const model =
    env.hfImageModel ||
    process.env.HF_IMAGE_MODEL ||
    "Tongyi-MAI/Z-Image-Turbo";

  const provider =
    env.hfImageProvider ||
    process.env.HF_IMAGE_PROVIDER ||
    "fal-ai";

  const prompt = buildHuggingFacePrompt({ story, scene });
  const negativePrompt = buildHuggingFaceNegativePrompt();

  console.log("HF IMAGE CLIENT DEBUG:", {
    provider,
    model,
    sceneOrder: scene.sceneOrder || scene.order,
  });

  let imageResult;

  try {
    imageResult = await client.textToImage({
      provider,
      model,
      inputs: prompt,
      parameters: {
        negative_prompt: negativePrompt,
        width: 1024,
        height: 576,
        num_inference_steps: 24,
        guidance_scale: 8,
      },
    });
  } catch (error) {
    console.error("Hugging Face client hatasi:", {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    throw new Error(`Hugging Face gorsel uretim hatasi: ${error.message}`);
  }

  let buffer;

  if (Buffer.isBuffer(imageResult)) {
    buffer = imageResult;
  } else if (imageResult instanceof ArrayBuffer) {
    buffer = Buffer.from(imageResult);
  } else if (imageResult?.arrayBuffer) {
    const arrayBuffer = await imageResult.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else if (imageResult?.data) {
    buffer = Buffer.from(imageResult.data);
  } else {
    throw new Error("Hugging Face beklenen gorsel verisini dondurmedi.");
  }

  const uniqueSuffix = Date.now();
  const fileName = `${story.id}-${scene.sceneOrder}-${slugify(scene.title)}-${uniqueSuffix}.png`;
  const absolutePath = path.join(imageUploadDir, fileName);
  const relativePath = `/uploads/images/${fileName}`;
  const publicUrl = `${getPublicBaseUrl()}${relativePath}`;

  await fs.writeFile(absolutePath, buffer);

  return {
    imageUrl: publicUrl,
    imagePath: relativePath,
    provider: `huggingface:${provider}`,
  };
};

const createSceneImageWithPollinations = async ({ story, scene }) => {
  await ensureUploadFolders();

  const prompt =
    `${buildCharacterConsistencyProfile(story)} ` +
    `${scene.prompt || scene.description || story.title}. ` +
    `cinematic, detailed, ${story.visualStyle || "storybook style"}, ` +
    `wide 16:9 image, no text, no watermark`;

  const uniqueSuffix = Date.now();
  const fileName = `${story.id}-${scene.sceneOrder}-${slugify(scene.title)}-${uniqueSuffix}.jpg`;
  const absolutePath = path.join(imageUploadDir, fileName);
  const relativePath = `/uploads/images/${fileName}`;
  const publicUrl = `${getPublicBaseUrl()}${relativePath}`;

  const pollinationsBaseUrl =
    env.pollinationsBaseUrl || process.env.POLLINATIONS_BASE_URL || "https://image.pollinations.ai";
  const pollinationsModel =
    env.pollinationsModel || process.env.POLLINATIONS_MODEL || "flux";

  const requestUrl =
    `${pollinationsBaseUrl}/prompt/${encodeURIComponent(prompt)}` +
    `?width=1280&height=720&model=${encodeURIComponent(pollinationsModel)}` +
    `&seed=${uniqueSuffix}`;

  const { buffer, contentType } = await downloadBuffer(requestUrl);

  if (!contentType.includes("image")) {
    throw new Error("Pollinations gorsel yerine farkli bir yanit dondurdu.");
  }

  await fs.writeFile(absolutePath, buffer);

  return {
    imageUrl: publicUrl,
    imagePath: relativePath,
    provider: "pollinations",
  };
};

const writeFallbackWav = async ({ outputPath, durationSeconds }) => {
  const sampleRate = 22050;
  const channels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const totalSamples = sampleRate * Math.max(3, Math.min(durationSeconds, 15));
  const dataSize = totalSamples * channels * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
  buffer.writeUInt16LE(channels * bytesPerSample, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const envelope = Math.sin(Math.PI * (i / totalSamples));
    const sample = Math.sin(2 * Math.PI * 220 * t) * 0.16 * envelope;
    buffer.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }

  await fs.writeFile(outputPath, buffer);
};

const synthesizeSpeechWithWindowsTts = async ({ text, outputPath }) => {
  await ensureUploadFolders();

  const safeName = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const textPath = path.join(audioUploadDir, `${safeName}.txt`);
  const scriptPath = path.join(audioUploadDir, "_storyvision_tts.ps1");

  const scriptContent = `
param(
  [string]$TextPath,
  [string]$OutputPath
)

Add-Type -AssemblyName System.Speech
$text = Get-Content -Path $TextPath -Raw -Encoding UTF8

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.Rate = 0
$synth.Volume = 100
$synth.SetOutputToWaveFile($OutputPath)
$synth.Speak($text)
$synth.Dispose()
`.trim();

  await fs.writeFile(textPath, text, "utf8");
  await fs.writeFile(scriptPath, scriptContent, "utf8");

  try {
    await runCommand("powershell.exe", [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      scriptPath,
      "-TextPath",
      textPath,
      "-OutputPath",
      outputPath,
    ]);
  } finally {
    await fs.rm(textPath, { force: true });
  }
};

const synthesizeSpeechWithElevenLabs = async ({ text, outputPath }) => {
  const apiKey = env.elevenlabsApiKey || process.env.ELEVENLABS_API_KEY || "";
  const voiceId = env.elevenlabsVoiceId || process.env.ELEVENLABS_VOICE_ID || "";
  const model = env.elevenlabsModel || process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
  const baseUrl = env.elevenlabsBaseUrl || process.env.ELEVENLABS_BASE_URL || "https://api.elevenlabs.io";

  if (!apiKey.trim()) {
    throw new Error("ELEVENLABS_API_KEY tanimli degil.");
  }

  if (!voiceId.trim()) {
    throw new Error("ELEVENLABS_VOICE_ID tanimli degil.");
  }

  const requestUrl = `${baseUrl}/v1/text-to-speech/${voiceId}`;

  const { buffer, contentType } = await downloadBuffer(requestUrl, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json; charset=utf-8",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: model,
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!contentType.includes("audio")) {
    throw new Error("ElevenLabs ses yerine farkli bir yanit dondurdu.");
  }

  await fs.writeFile(outputPath, buffer);
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
    const providers = [];
    const imageProvider = String(
      env.imageProvider || process.env.IMAGE_PROVIDER || "huggingface"
    ).toLowerCase();

    for (const scene of story.scenes.slice(0, 3)) {
      let image;

      try {
        if (imageProvider === "huggingface" || imageProvider === "hf") {
          image = await createSceneImageWithHuggingFace({ story, scene });
        } else if (imageProvider === "pollinations") {
          image = await createSceneImageWithPollinations({ story, scene });
        } else if (imageProvider === "svg-fallback") {
          image = await createSceneSvgFallback({ story, scene });
        } else {
          throw new Error(`Bilinmeyen IMAGE_PROVIDER degeri: ${imageProvider}`);
        }
      } catch (providerError) {
        const fallbackEnabled = env.imageFallbackEnabled !== false;

        if (!fallbackEnabled) {
          throw providerError;
        }

        console.warn(
          "Gorsel AI saglayicisi basarisiz oldu, SVG fallback kullaniliyor:",
          providerError.message
        );

        image = await createSceneSvgFallback({ story, scene });
      }

      providers.push(image.provider);

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
      provider: [...new Set(providers)].join(", "),
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

const generateStoryAudio = async (storyId) => {
  const story = await storyRepository.getStoryById(storyId);

  if (!story) {
    const error = new Error("Ses uretilecek hikaye bulunamadi.");
    error.statusCode = 404;
    error.isOperational = true;
    throw error;
  }

  const text = String(story.content || story.text || "").trim();

  if (!text) {
    const error = new Error("Hikaye metni bos oldugu icin ses uretilemedi.");
    error.statusCode = 400;
    error.isOperational = true;
    throw error;
  }

  await ensureUploadFolders();

  const durationSeconds = estimateDurationSeconds(text);
  const uniqueSuffix = Date.now();

  const mp3FileName = `${story.id}-${slugify(story.title)}-${uniqueSuffix}-ses.mp3`;
  const wavFileName = `${story.id}-${slugify(story.title)}-${uniqueSuffix}-ses.wav`;

  const mp3AbsolutePath = path.join(audioUploadDir, mp3FileName);
  const mp3RelativePath = `/uploads/audio/${mp3FileName}`;
  const mp3PublicUrl = `${getPublicBaseUrl()}${mp3RelativePath}`;

  const wavAbsolutePath = path.join(audioUploadDir, wavFileName);
  const wavRelativePath = `/uploads/audio/${wavFileName}`;
  const wavPublicUrl = `${getPublicBaseUrl()}${wavRelativePath}`;

  await storyRepository.upsertMediaJob({
    storyId,
    type: "audio",
    status: "processing",
  });

  await storyRepository.updateStoryMediaStatus({
    storyId,
    type: "audio",
    status: "processing",
  });

  await storyRepository.upsertStoryAudio({
    storyId,
    audioUrl: null,
    audioPath: null,
    narrator: story.narrator || "StoryVision TTS",
    durationSeconds,
    status: "processing",
  });

  try {
    let finalAudioUrl = null;
    let finalAudioPath = null;
    let narrator = story.narrator || "StoryVision TTS";
    let provider = env.ttsProvider || process.env.TTS_PROVIDER || "windows";

    try {
      if (provider === "elevenlabs") {
        await synthesizeSpeechWithElevenLabs({
          text,
          outputPath: mp3AbsolutePath,
        });

        finalAudioUrl = mp3PublicUrl;
        finalAudioPath = mp3RelativePath;
        narrator = "ElevenLabs";
      } else {
        await synthesizeSpeechWithWindowsTts({
          text,
          outputPath: wavAbsolutePath,
        });

        finalAudioUrl = wavPublicUrl;
        finalAudioPath = wavRelativePath;
        narrator = "Windows TTS";
        provider = "windows";
      }
    } catch (providerError) {
      console.warn(
        "Ana ses saglayicisi basarisiz oldu, Windows TTS fallback deneniyor:",
        providerError.message
      );

      try {
        await synthesizeSpeechWithWindowsTts({
          text,
          outputPath: wavAbsolutePath,
        });

        finalAudioUrl = wavPublicUrl;
        finalAudioPath = wavRelativePath;
        narrator = "Windows TTS";
        provider = "windows";
      } catch (windowsError) {
        console.warn(
          "Windows TTS de basarisiz oldu, fallback wav olusturuluyor:",
          windowsError.message
        );

        await writeFallbackWav({
          outputPath: wavAbsolutePath,
          durationSeconds,
        });

        finalAudioUrl = wavPublicUrl;
        finalAudioPath = wavRelativePath;
        narrator = "Fallback Wave";
        provider = "fallback";
      }
    }

    await storyRepository.upsertStoryAudio({
      storyId,
      audioUrl: finalAudioUrl,
      audioPath: finalAudioPath,
      narrator,
      durationSeconds,
      status: "ready",
    });

    await storyRepository.upsertMediaJob({
      storyId,
      type: "audio",
      status: "ready",
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "audio",
      status: "ready",
    });

    return {
      storyId,
      status: "ready",
      provider,
      audioUrl: finalAudioUrl,
      audioPath: finalAudioPath,
      durationSeconds,
      narrator,
    };
  } catch (error) {
    await storyRepository.upsertStoryAudio({
      storyId,
      audioUrl: null,
      audioPath: null,
      narrator: story.narrator || "StoryVision TTS",
      durationSeconds,
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.upsertMediaJob({
      storyId,
      type: "audio",
      status: "failed",
      errorMessage: error.message,
    });

    await storyRepository.updateStoryMediaStatus({
      storyId,
      type: "audio",
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
  generateStoryAudio,
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};