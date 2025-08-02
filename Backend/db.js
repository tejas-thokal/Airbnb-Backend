const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false, // 🔐 Allow self-signed certs (needed for Render)
  }
});

pool.connect()
  .then(() => {
    console.log('✅ Connected to the database successfully!');
    return pool.end();
  })
  .catch((err) => {
    console.error('❌ Error connecting to the database:', err);
  });
