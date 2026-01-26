import express from 'express';
import Database from 'better-sqlite3';
import path from 'node:path';

const app = express();
const db = new Database(path.resolve('..', 'database', 'db.sqlite'), { fileMustExist: true });

app.get('/api/movies/top', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, overview, poster
    FROM movie
    ORDER BY updated_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

app.get('/api/movies/:id', (req, res) => {
  const row = db.prepare(`
    SELECT
      m.id,
      m.title,
      m.overview,
      m.poster,
      m.duration,
      COALESCE(g.type, '—') AS genre,
      m.directors AS director
    FROM movie m
    LEFT JOIN genres g ON g.id = m.genre_id
    WHERE m.id = ?
  `).get(req.params.id);

  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

app.get('/api/gifts', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, name, type, price
    FROM gifts
    ORDER BY price
  `).all();
  res.json(rows);
});

app.get('/api/sessions', (_req, res) => {
  const rows = db.prepare(`
    SELECT 
      s.id,
      m.id as movie_id,
      m.title,
      s.cinema_name as cinema,
      s.hall,
      s.time,
      s.date,
      s.seats_available,
      s.language,
      s.subtitles,
      s.format
    FROM sessions s
    LEFT JOIN movie m ON s.movie_id = m.id
    ORDER BY s.date, s.time
  `).all();
  res.json(rows);
});

app.listen(4000, () => console.log('API on http://localhost:4000'));