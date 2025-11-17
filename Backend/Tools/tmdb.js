const express = require('express');
const router = express.Router();
const axios = require('axios');

const API_KEY = process.env.TMDB_API_KEY;
if (!API_KEY) {
  console.warn('TMDB API key not set in TMDB_API_KEY environment variable');
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w500';

// Search movies by query and return first page of results
router.get('/search', async (req, res) => {
  const q = req.query.q;
  if (!q) return res.status(400).json({ error: 'missing query parameter q' });
  try {
    const url = `https://api.themoviedb.org/3/search/movie`;
    const resp = await axios.get(url, { params: { api_key: API_KEY, query: q } });
    const data = resp.data || {};
    // map results and include full poster url when available
    if (Array.isArray(data.results)) {
      data.results = data.results.map(r => ({
        id: r.id,
        title: r.title,
        overview: r.overview,
        release_date: r.release_date,
        poster_path: r.poster_path,
        poster: r.poster_path ? IMAGE_BASE + r.poster_path : null
      }));
    }
    res.json(data);
  } catch (err) {
    console.error('TMDB search error', err && err.message);
    res.status(500).json({ error: 'tmdb error', details: err && err.message });
  }
});

// Get movie details by TMDB id
router.get('/movie/:id', async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'missing id parameter' });
  try {
    const url = `https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}`;
    const resp = await axios.get(url, { params: { api_key: API_KEY, append_to_response: 'images,videos' } });
    const d = resp.data || {};
    d.poster = d.poster_path ? IMAGE_BASE + d.poster_path : null;
    res.json(d);
  } catch (err) {
    console.error('TMDB movie error', err && err.message);
    res.status(500).json({ error: 'tmdb error', details: err && err.message });
  }
});

module.exports = router;
