const app = require("./src/app");
const { env, validateEnv } = require("./src/config/env");

try {
  validateEnv();

  // Sunucuyu baslatir
  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port} in ${env.nodeEnv} mode`);
  });
} catch (error) {
  console.error("Server failed to start:", error.message);
  process.exit(1);
}
