// Load environment variables first
require('dotenv').config();

// Log environment variables status (without exposing values)
console.log('Environment Variables Status:', {
  NODE_ENV: process.env.NODE_ENV || 'Not Set',
  PORT: process.env.PORT ? 'Set' : 'Not Set',
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not Set',
  CLIENT_URL: process.env.CLIENT_URL ? 'Set' : 'Not Set',
  PRODUCTION_URL: process.env.PRODUCTION_URL ? 'Set' : 'Not Set',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not Set'
});

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pool = require('./db.js');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cookieParser = require('cookie-parser');
console.log("Pool instance check:", typeof pool.query); // Should be 'function'

const app = express();

// Configure Passport Google OAuth Strategy
console.log('Google OAuth Environment Variables:', {
  clientID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not Set',
  clientSecret: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not Set'
});

// Only initialize Google Strategy if environment variables are available
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists in database
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE google_id = $1",
      [profile.id]
    );

    if (existingUser.rows.length > 0) {
      // User exists, return the user
      return done(null, existingUser.rows[0]);
    }

    // User doesn't exist, create a new user
    const newUser = await pool.query(
      `INSERT INTO users (google_id, email, first_name, last_name, profile_picture) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        profile.id,
        profile.emails[0].value,
        profile.name.givenName,
        profile.name.familyName,
        profile.photos[0].value
      ]
    );

    return done(null, newUser.rows[0]);
  } catch (error) {
    console.error('Error in Google Strategy:', error);
    return done(error, null);
  }
  }));
}

// Serialize user to store in session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    done(null, result.rows[0]);
  } catch (error) {
    done(error, null);
  }
});

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

// Session configuration
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Initialize Passport and restore authentication state from session
app.use(passport.initialize());
app.use(passport.session());
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

// Google Authentication Routes
app.get('/auth/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Google authentication is not configured' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

app.get('/auth/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ error: 'Google authentication is not configured' });
  }
  
  passport.authenticate('google', { failureRedirect: '/login' })(req, res, next);
}, (req, res) => {
  // Successful authentication, redirect to client
  const redirectUrl = process.env.NODE_ENV === 'production' 
    ? process.env.PRODUCTION_URL 
    : process.env.CLIENT_URL;
  res.redirect(`${redirectUrl}?login=success`);
});

// Get current user
app.get('/api/current-user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    res.json({ isAuthenticated: false });
  }
});

// Logout route
app.get('/api/logout', (req, res) => {
  console.log('Logout route called');
  console.log('User authenticated:', req.isAuthenticated());
  
  if (req.isAuthenticated()) {
    req.logout((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Error during logout' });
      }
      console.log('User logged out successfully');
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
          return res.status(500).json({ error: 'Error destroying session' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
      });
    });
  } else {
    console.log('User not authenticated, sending success anyway');
    res.json({ success: true, message: 'Not logged in' });
  }
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Log deployment environment information
  console.log('Server Environment:', {
    NODE_ENV: process.env.NODE_ENV || 'development',
    GOOGLE_AUTH: process.env.GOOGLE_CLIENT_ID ? 'Configured' : 'Not Configured'
  });
  
  // Provide helpful message about environment variables
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn('⚠️ Google OAuth is not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your environment variables in Render Dashboard.');
    console.warn('ℹ️ For Render deployments, add environment variables in the Dashboard under Environment > Environment Variables.');
  }
});
