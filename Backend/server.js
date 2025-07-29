const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db'); // <-- Your db connection
require('dotenv').config();

const app = express();

// CORS setup for your frontend
app.use(cors({
  origin: 'https://mini-air-bnb-clone.netlify.app',
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(bodyParser.json()); // for parsing application/json

// ✅ REGISTER ROUTE
app.post('/register', async (req, res) => {
  const { phone } = req.body;
  console.log("📲 Register request received:", phone);

  const query = `
    INSERT INTO users (mobile)
    VALUES ($1)
    ON CONFLICT (mobile) DO NOTHING
  `;

  try {
    const result = await pool.query(query, [phone]);
    console.log("✅ DB Insert result:", result.rowCount); // log how many rows inserted

    res.json({
      message: result.rowCount === 1 
        ? 'Phone number saved successfully!' 
        : 'Phone number already exists or not inserted.'
    });

  } catch (err) {
    console.error("❌ Register DB error:", err.message);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
});

// ✅ TEST DATABASE ROUTE
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    res.json({ message: 'DB working ✅', users: result.rows });
  } catch (err) {
    console.error('❌ DB Test Error:', err.message);
    res.status(500).json({ message: 'DB test failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
