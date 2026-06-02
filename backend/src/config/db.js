const { Pool } = require("pg");
const { env } = require("./env");

const pool = new Pool({
  connectionString: env.databaseUrl,
});

const query = (text, params) => {
  return pool.query(text, params);
};

const getClient = () => {
  return pool.connect();
};

const testConnection = async () => {
  const result = await query("SELECT NOW() AS now");
  return result.rows[0];
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
};