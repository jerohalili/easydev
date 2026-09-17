const { Pool } = require('pg');
require('dotenv').config();

// SSL only when connection string requires it (Neon vs local)
const useSSL = process.env.DATABASE_URL?.includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { require: true } : false,
});

module.exports = pool;