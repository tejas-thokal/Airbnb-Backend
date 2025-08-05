const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addGoogleAuthFields() {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    console.log('Connected to database');
    
    // Check if google_id column already exists
    const checkColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_id';
    `;
    
    const columnCheck = await client.query(checkColumnQuery);
    
    if (columnCheck.rows.length === 0) {
      // Add google_id column if it doesn't exist
      console.log('Adding google_id column...');
      await client.query(`ALTER TABLE users ADD COLUMN google_id TEXT;`);
      console.log('Added google_id column');
    } else {
      console.log('google_id column already exists');
    }
    
    // Check if profile_picture column already exists
    const checkPictureColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'profile_picture';
    `;
    
    const pictureColumnCheck = await client.query(checkPictureColumnQuery);
    
    if (pictureColumnCheck.rows.length === 0) {
      // Add profile_picture column if it doesn't exist
      console.log('Adding profile_picture column...');
      await client.query(`ALTER TABLE users ADD COLUMN profile_picture TEXT;`);
      console.log('Added profile_picture column');
    } else {
      console.log('profile_picture column already exists');
    }
    
    console.log('Migration completed successfully');
    client.release();
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the migration
addGoogleAuthFields();