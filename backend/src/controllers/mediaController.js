const mediaService = require("../services/mediaService");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../errors/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const {
  validateMediaImageInput,
  validateMediaAudioInput,
  validateMediaVideoInput,
} = require("../utils/promptValidator");

// Demo gorsel talebini yonetir
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

// Demo ses talebini yonetir
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

// Demo video talebini yonetir
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
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};
