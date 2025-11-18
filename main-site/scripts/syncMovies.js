import 'dotenv/config';
import fetch from 'node-fetch';
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = path.resolve('..', 'database', 'db.sqlite');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.prepare(`
  CREATE TABLE IF NOT EXISTS movies(
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    overview TEXT,
    poster TEXT,
    updated_at TEXT NOT NULL
  )
`).run();

(async () => {
  const apiUrl = process.env.MOVIE_API_URL ?? 'https://api.themoviedb.org/3/movie/popular';

  const res = await fetch(`${apiUrl}?api_key=${process.env.MOVIE_API_KEY}`);
  const data = await res.json();

  const upsert = db.prepare(`
    INSERT INTO movies(id, title, overview, poster, updated_at)
    VALUES (@id, @title, @overview, @poster, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      title=excluded.title,
      overview=excluded.overview,
      poster=excluded.poster,
      updated_at=datetime('now')
  `);

  const items = data.results ?? [];
  console.log('Fetched items:', items.length);
  db.transaction(list => {
    for (const movie of list) {
      upsert.run({
        id: movie.id,
        title: movie.title,
        overview: movie.overview ?? '',
        poster: movie.poster_path ?? ''
      });
    }
  })(items);
  db.close();
})();