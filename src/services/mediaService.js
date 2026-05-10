// Goruntu, ses ve video icin demo isleri hazirlar
const getDemoImage = async ({ topic, genre }) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    assetType: "image",
    status: "queued",
    description: `${genre} tarzi, ${topic} temali bir gorsel icin demo istek olusturuldu.`,
  };
};

const getDemoAudio = async ({ topic, character }) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    assetType: "audio",
    status: "queued",
    description: `${character} karakteri icin ${topic} odakli bir ses kaydi demo olarak hazirlandi.`,
  };
};

const getDemoVideo = async ({ topic, genre, length }) => {
  await new Promise((resolve) => setTimeout(resolve, 1200));

  return {
    assetType: "video",
    status: "queued",
    description: `${genre} turunde, ${topic} temasini isleyen ve ${length} uzunlugunda bir video akisi demo olarak hazirlandi.`,
  };
};

module.exports = {
  getDemoImage,
  getDemoAudio,
  getDemoVideo,
};
