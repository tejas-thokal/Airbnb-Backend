const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db.js');
require('dotenv').config();

const app = express();

// ✅ Middleware
app.use(bodyParser.json()); // To parse JSON bodies

// ✅ Allow requests from localhost and Netlify
const allowedOrigins = [
  process.env.CLIENT_URL,
  process.env.PRODUCTION_URL
];

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// ✅ Step 1: Register user
app.post('/register', async (req, res) => {
  const { phonenumber } = req.body;
  console.log("📲 Register request received:", phonenumber);

  const query = `
    INSERT INTO users (phonenumber)
    VALUES ($1)
    ON CONFLICT (phonenumber) DO NOTHING
  `;

  try {
    await pool.query(query, [phonenumber]);
    res.json({ message: 'Mobile number saved successfully!' });
  } catch (err) {
    console.error("❌ Register DB error:", err.message);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
});

// ✅ Step 2: Signup user
app.post('/signup', async (req, res) => {
  const { phonenumber, firstName, lastName, dob, email } = req.body;

  const query = `
    UPDATE users
    SET first_name = $1, last_name = $2, dob = $3, email = $4
    WHERE phonenumber = $5
  `;

  try {
    const result = await pool.query(query, [
      firstName,
      lastName,
      dob,
      email,
      phonenumber
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "User not found for given mobile number" });
    }

    res.json({ message: "User info updated successfully!" });
  } catch (err) {
    console.error("❌ Signup DB error:", err.message);
    res.status(500).json({ message: 'Database error: ' + err.message });
  }
});

// ✅ Test DB route
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
