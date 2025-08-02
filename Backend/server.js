const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db.js');
console.log("Pool instance check:", typeof pool.query); // Should be 'function'
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
  const { phonenumber } = req.body;
  if (!phonenumber) return res.status(400).json({ error: "Phone number required" });

  console.log("Request body:", req.body);

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE phonenumber = $1",
      [phonenumber]
    );

    if (result.rows.length > 0) {
      return res.status(409).json({ message: "Phone number already registered" });
    }

    // ✅ INSERT phone number with null values for others
    const insert = await pool.query(
      `INSERT INTO users (phonenumber) VALUES ($1) RETURNING *`,
      [phonenumber]
    );

    return res.status(201).json({ message: "Phone number saved", user: insert.rows[0] });

  } catch (error) {
    console.error("❌ DB error (check-phone):", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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
// Pseudo code logic for /signup POST handler
app.post('/signup', async (req, res) => {
  const { phonenumber, first_name, last_name, email, dob } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE phonenumber = $1",
      [phonenumber]
    );

    if (existingUser.rows.length === 0) {
      // Instead of returning 404, INSERT new user (optional fallback)
      return res.status(404).json({ error: "Phone number not registered. Please verify phone number first." });
    }

    // ✅ UPDATE user where phone number matches
    const result = await pool.query(
      `UPDATE users 
       SET first_name = $1, last_name = $2, email = $3, dob = $4 
       WHERE phonenumber = $5
       RETURNING *`,
      [first_name, last_name, email, dob, phonenumber]
    );

    res.status(200).json({ message: "Signup successful", user: result.rows[0] });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Server error" });
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
