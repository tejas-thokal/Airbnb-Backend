require("dotenv").config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2');

const app = express();
app.use(cors({ origin: '*' })); // ✅ Allow all origins
app.use(bodyParser.json());

// ✅ MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});


db.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL');
  }
});

// ✅ Route to register phone number
app.post('/register', (req, res) => {
  const { phone } = req.body;
  const query = 'INSERT IGNORE INTO users (phone) VALUES (?)';

  db.query(query, [phone], (err, result) => {
    if (err) {
      console.error(err);
      res.status(500).json({ message: 'Database error' });
    } else {
      res.json({ message: 'Phone number saved successfully!' });
    }
  });
});

// ✅ ADD THIS: Route to handle signup data
// ✅ Signup endpoint
app.post('/signup', (req, res) => {
  const { phone, firstName, lastName, dob, email } = req.body;

  const query = `
    UPDATE users 
    SET firstName = ?, lastName = ?, dob = ?, email = ?
    WHERE phone = ?
  `;

  db.query(query, [firstName, lastName, dob, email, phone], (err, result) => {
    if (err) {
      console.error('Signup DB error:', err);
      return res.status(500).json({ message: 'Database error: ' + err.message });
    }

    return res.json({ message: 'Signup details updated successfully!' });
  });
});


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});

