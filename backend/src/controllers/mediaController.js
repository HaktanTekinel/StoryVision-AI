const mediaService = require("../services/mediaService");
const videoService = require("../services/videoService");
const subtitleService = require("../services/subtitleService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../errors/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const {
  validateMediaImageInput,
  validateMediaAudioInput,
  validateMediaVideoInput,
} = require("../utils/promptValidator");

const generateStoryImages = asyncHandler(async (req, res) => {
  const result = await mediaService.generateStoryImages(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye sahneleri icin gorseller olusturuldu.",
    data: result,
  });
});

const generateStoryAudio = asyncHandler(async (req, res) => {
  const result = await mediaService.generateStoryAudio(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye metni sese donusturuldu.",
    data: result,
  });
});

const generateStoryVideo = asyncHandler(async (req, res) => {
  const result = await videoService.generateStoryVideo(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye gorselleri ve sesi kullanilarak video olusturuldu.",
    data: result,
  });
});

const generateStorySubtitles = asyncHandler(async (req, res) => {
  const result = await subtitleService.generateStorySubtitles(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye videosu icin altyazi olusturuldu.",
    data: result,
  });
});

const getDemoImage = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateMediaImageInput({
    ...req.query,
    ...req.body,
  });

  if (!isValid) {
    throw new AppError(`Gecersiz gorsel girdileri: ${errors.join(" ")}`, 400);
  }

  const result = await mediaService.getDemoImage(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Demo gorsel talebi olusturuldu.",
    data: result,
  });
});

const getDemoAudio = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateMediaAudioInput({
    ...req.query,
    ...req.body,
  });

  if (!isValid) {
    throw new AppError(`Gecersiz ses girdileri: ${errors.join(" ")}`, 400);
  }

  const result = await mediaService.getDemoAudio(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Demo ses talebi olusturuldu.",
    data: result,
  });
});

const getDemoVideo = asyncHandler(async (req, res) => {
  const { isValid, errors, data } = validateMediaVideoInput({
    ...req.query,
    ...req.body,
  });

  if (!isValid) {
    throw new AppError(`Gecersiz video girdileri: ${errors.join(" ")}`, 400);
  }

  const result = await mediaService.getDemoVideo(data);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Demo video talebi olusturuldu.",
    data: result,
  });
});

module.exports = {
  generateStoryImages,
  generateStoryAudio,
  generateStoryVideo,
  generateStorySubtitles,
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};