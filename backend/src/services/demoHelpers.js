const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_DEMO_DELAY_MS = 1000;

const buildQueuedAssetResponse = ({ assetType, description }) => {
  return {
    assetType,
    status: "queued",
    description,
  };
};

module.exports = {
  delay,
  DEFAULT_DEMO_DELAY_MS,
  buildQueuedAssetResponse,
};
