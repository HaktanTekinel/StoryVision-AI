const { delay, buildQueuedAssetResponse } = require("./demoHelpers");

// Goruntu, ses ve video icin demo isleri hazirlar
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
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};
