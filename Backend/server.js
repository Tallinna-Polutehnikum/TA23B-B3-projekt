const express = require('express');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parsing
app.use(express.json());

// mount existing routers if present
try {
  const films = require('./Tools/films');
  app.use('/api/films', films);
} catch (e) {
  console.warn('Could not mount /api/films:', e && e.message);
}

// TMDB proxy
try {
  const tmdb = require('./Tools/tmdb');
  app.use('/tmdb', tmdb);
} catch (e) {
  console.warn('Could not mount /tmdb route:', e && e.message);
}

// Users API
try {
  const users = require('./users');
  app.use('/api/users', users);
} catch (e) {
  console.warn('Could not mount /api/users:', e && e.message);
}

// Serve static site root to make testing simple
const siteRoot = path.join(__dirname, '..');
app.use(express.static(siteRoot));

app.listen(PORT, () => {
  console.log(`Backend server listening on http://localhost:${PORT}`);
});
