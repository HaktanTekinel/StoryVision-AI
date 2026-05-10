require("dotenv").config();

const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Sunucuyu baslatir
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
