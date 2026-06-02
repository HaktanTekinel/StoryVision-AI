const storyService = require("../services/storyService");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

const createStory = asyncHandler(async (req, res) => {
  const story = await storyService.createStory(req.body);

  return sendSuccess(res, {
    statusCode: 201,
    message: "Hikaye olusturuldu ve veritabanina kaydedildi.",
    data: story,
  });
});

const getStories = asyncHandler(async (req, res) => {
  const stories = await storyService.getStories();

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikayeler listelendi.",
    data: stories,
  });
});

const getStoryById = asyncHandler(async (req, res) => {
  const story = await storyService.getStoryById(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye detayi getirildi.",
    data: story,
  });
});

const deleteStory = asyncHandler(async (req, res) => {
  const result = await storyService.deleteStory(req.params.id);

  return sendSuccess(res, {
    statusCode: 200,
    message: "Hikaye silindi.",
    data: result,
  });
});

module.exports = {
  createStory,
  getStories,
  getStoryById,
  deleteStory,
};