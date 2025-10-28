const express = require('express');
const router = express.Router();
const db = require('./db');

router.get('/', async (req, res) => {
  const films = await db.all('SELECT * FROM films');
  res.json(films);
});

module.exports = router;
