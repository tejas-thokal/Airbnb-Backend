const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function makePhoneNumberNullable() {
  try {
    // Connect to the database
    const client = await pool.connect();
    
    console.log('Connected to database');
    
    // Check if phonenumber column is already nullable
    const checkColumnQuery = `
      SELECT column_name, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'phonenumber';
    `;
    
    const columnCheck = await client.query(checkColumnQuery);
    
    if (columnCheck.rows.length > 0 && columnCheck.rows[0].is_nullable === 'NO') {
      // Make phonenumber column nullable
      console.log('Making phonenumber column nullable...');
      await client.query(`ALTER TABLE users ALTER COLUMN phonenumber DROP NOT NULL;`);
      console.log('Made phonenumber column nullable');
    } else if (columnCheck.rows.length > 0) {
      console.log('phonenumber column is already nullable');
    } else {
      console.log('phonenumber column not found');
    }
    
    // Add google_auth_pending column if it doesn't exist
    const checkPendingColumnQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'google_auth_pending';
    `;
    
    const pendingColumnCheck = await client.query(checkPendingColumnQuery);
    
    if (pendingColumnCheck.rows.length === 0) {
      // Add google_auth_pending column if it doesn't exist
      console.log('Adding google_auth_pending column...');
      await client.query(`ALTER TABLE users ADD COLUMN google_auth_pending BOOLEAN DEFAULT FALSE;`);
      console.log('Added google_auth_pending column');
    } else {
      console.log('google_auth_pending column already exists');
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
makePhoneNumberNullable();