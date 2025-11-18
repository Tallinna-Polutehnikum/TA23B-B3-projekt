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
  const row = db.prepare(`SELECT * FROM movie WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ message: 'Not found' });
  res.json(row);
});

app.listen(4000, () => console.log('API on http://localhost:4000'));