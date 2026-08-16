const { Pool } = require('pg');
require('dotenv').config();

// Neon connection strings include `sslmode=require`; a bare local
// Postgres connection string typically doesn't, so this only turns SSL
// on when it's actually needed.
const useSSL = process.env.DATABASE_URL?.includes('sslmode=require');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { require: true } : false,
});

module.exports = pool;