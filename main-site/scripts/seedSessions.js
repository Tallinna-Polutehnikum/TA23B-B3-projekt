import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
const db = new Database(dbPath);

const dayStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const toIsoDate = (date) => date.toISOString().slice(0, 10);
const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const ensureShowtimesRange = (startDate, endDate) => {
  const start = dayStart(startDate);
  const end = dayStart(endDate);
  const times = ['12:00', '15:30', '19:00', '21:30'];

  const halls = db.prepare(`
    SELECT h.id, h.hall_number, c.name AS cinema_name
    FROM hall h
    JOIN cinema c ON c.id = h.cinema_id
    ORDER BY c.name, h.hall_number
  `).all();

  const movies = db.prepare(`
    SELECT id
    FROM movie
    ORDER BY updated_at DESC
    LIMIT 12
  `).all();

  if (halls.length === 0 || movies.length === 0) return { inserted: 0 };

  const existingRows = db.prepare(`
    SELECT hall_id, date
    FROM showtime
    WHERE date(date) >= date(?) AND date(date) <= date(?)
  `).all(toIsoDate(start), toIsoDate(end));

  const existing = new Set(existingRows.map((row) => `${row.hall_id}|${row.date}`));

  const insertShowtime = db.prepare(`
    INSERT INTO showtime (hall_id, movie_id, date)
    VALUES (?, ?, ?)
  `);

  let inserted = 0;
  const seed = db.transaction(() => {
    let movieIndex = 0;
    for (let d = 0; d <= Math.floor((end - start) / (24 * 60 * 60 * 1000)); d += 1) {
      const dateStr = toIsoDate(addDays(start, d));
      halls.forEach((hall) => {
        times.forEach((time) => {
          const dateTime = `${dateStr} ${time}`;
          const key = `${hall.id}|${dateTime}`;
          if (existing.has(key)) return;
          const movie = movies[movieIndex % movies.length];
          movieIndex += 1;
          insertShowtime.run(hall.id, movie.id, dateTime);
          existing.add(key);
          inserted += 1;
        });
      });
    }
  });

  seed();
  return { inserted };
};

const start = new Date(2026, 1, 3);
const end = new Date(2026, 1, 16);
const { inserted } = ensureShowtimesRange(start, end);

console.log(`Seeded showtime rows: ${inserted}`);
