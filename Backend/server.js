const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db');
require('dotenv').config();

const app = express();

// ✅ Use VITE_CLIENT_URL from .env (used with Vite)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ✅ Middleware
app.use(cors({
  origin: CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(bodyParser.json());

// ✅ STEP 1: Register user with mobile number only
app.post('/register', async (req, res) => {
  const { phone } = req.body;
  console.log("📲 Register request received:", phone);

  const query = `
    INSERT INTO users (mobile)
    VALUES ($1)
    ON CONFLICT (mobile) DO NOTHING
  `;

  try {
    await pool.query(query, [phone]);
    res.json({ message: 'Mobile number saved successfully!' });
  } catch (err) {
    console.error("❌ Register DB error:", err.message);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
});

// ✅ STEP 2: Signup - update user info based on phone number
app.post('/signup', async (req, res) => {
  const { phone, firstName, lastName, dob, email } = req.body;

  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, dob = $3, email = $4
    WHERE mobile = $5
  `;

  try {
    const result = await pool.query(query, [
      firstName,
      lastName,
      dob,
      email,
      phone
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found for given phone number" });
    }

    res.json({ message: "User info updated successfully!" });
  } catch (err) {
    console.error("❌ Signup DB error:", err.message);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
});

// Optional: Test DB connection
app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users LIMIT 5');
    res.json({ message: 'DB working ✅', users: result.rows });
  } catch (err) {
    console.error('❌ DB Test Error:', err.message);
    res.status(500).json({ message: 'DB test failed', error: err.message });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
