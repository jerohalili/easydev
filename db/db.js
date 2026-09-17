const { Pool } = require('pg');
require('dotenv').config();

// Neon needs SSL (sslmode=require in the pooled URL), local Postgres doesn't.
// Got burned once by forcing SSL everywhere — local dev refused to connect.
const useSSL = process.env.DATABASE_URL?.includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { require: true } : false,
});

module.exports = pool;