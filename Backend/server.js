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
// Route: POST /check-phone
app.post("/check-phone", async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: "Phone number required" });

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phonenumber = $1",
      [phone]
    );

    if (result.rows.length > 0) {
      // Phone already exists
      return res.status(409).json({ message: "Phone number already registered" });
    }

    // Phone is unique, allow to proceed
    return res.status(200).json({ message: "Phone number is new" });

  } catch (err) {
    console.error("❌ DB error (check-phone):", err.message);
    return res.status(500).json({ error: "Server error" });
  }
});

// ✅ Step 1: Register user
// Route: POST /register
app.post("/register", async (req, res) => {
  const { phone, firstName, lastName, dob, email } = req.body;

  if (!phone || !firstName || !lastName || !dob || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO users (phonenumber, first_name, last_name, dob, email) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [phone, firstName, lastName, dob, email]
    );

    res.status(201).json({ message: "User registered", user: result.rows[0] });

  } catch (err) {
    console.error("❌ Register DB error:", err.message);
    res.status(500).json({ error: "Database error" });
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
