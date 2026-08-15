const express = require('express');
const serverless = require('serverless-http');
const app = express();

app.use(express.json());

// Import or paste your assessment routes here
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Export as serverless function
module.exports = app;
module.exports.handler = serverless(app);