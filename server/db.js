const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Uncomment line below if using hosted services like Neon/Supabase:
  // ssl: { rejectUnauthorized: false }
});

module.exports = pool;