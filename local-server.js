require('dotenv').config({ quiet: true });
const app = require('./api/index.js');

const PORT = Number(process.env.API_PORT || 3001);

app.listen(PORT, () => {
  console.log(`EasyDev local API listening on http://localhost:${PORT}`);
});
