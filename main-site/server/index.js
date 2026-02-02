import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
// simple request logger to help debug connectivity
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});

let db;
try {
  const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
  console.log('Opening database at:', dbPath);
  db = new Database(dbPath);
  console.log('✓ Database opened successfully');
} catch (err) {
  console.error('✗ Failed to open database:', err.message);
  process.exit(1);
}

app.get('/api/movies/top', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, overview, poster
    FROM movie
    ORDER BY updated_at DESC
    LIMIT 20
  `).all();
  res.json(rows);
});

app.get('/api/movies/coming-soon', (_req, res) => {
  const rows = db.prepare(`
    SELECT id, title, overview, poster, genre_id
    FROM comingsoon_movies
    ORDER BY id ASC
    LIMIT 10
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

// bind to all interfaces to avoid firewall/IPv6 issues
const server = app.listen(4000, '0.0.0.0', () => {
  console.log('✓ API listening on http://localhost:4000');
  console.log('Server object:', server.listening);
  setInterval(() => {
    console.log('Server still alive at', new Date().toISOString());
  }, 5000);
});

// graceful error handling
server.on('error', (err) => {
  console.error('✗ Server error:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('✗ Uncaught exception:', err);
  process.exit(1);
});