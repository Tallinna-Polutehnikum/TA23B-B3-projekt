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

const tableExists = (name) => {
  const result = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name = ?
  `).get(name);
  return Boolean(result);
};

const getHallSeatCounts = () => {
  if (!tableExists('seat')) return new Map();
  const rows = db.prepare(`
    SELECT hall_id, COUNT(*) AS total_seats
    FROM seat
    GROUP BY hall_id
  `).all();
  const map = new Map();
  rows.forEach((row) => map.set(row.hall_id, row.total_seats));
  return map;
};

const ensureSessionsEveryFiveDays = (startDate, endDate) => {
  const start = dayStart(startDate);
  const end = dayStart(endDate);
  const dayInterval = 1; // seed every day
  const times = ['12:00', '15:30', '19:00', '21:30'];
  const defaultSeats = 120;

  const seatCounts = getHallSeatCounts();

  const halls = db.prepare(`
    SELECT h.id, h.cinema_id
    FROM hall h
    JOIN cinema c ON c.id = h.cinema_id
    ORDER BY c.name, h.id
  `).all().map((hall) => ({
    ...hall,
    seats: seatCounts.get(hall.id) ?? defaultSeats
  }));

  const movies = db.prepare(`
    SELECT id
    FROM movie
    ORDER BY updated_at DESC
    LIMIT 12
  `).all();

  if (halls.length === 0 || movies.length === 0) return { inserted: 0 };

  const existingRows = db.prepare(`
    SELECT hall_id, date, time
    FROM sessions
    WHERE date(date) >= date(?) AND date(date) <= date(?)
  `).all(toIsoDate(start), toIsoDate(end));

  const existing = new Set(existingRows.map((row) => `${row.hall_id}|${row.date}|${row.time}`));

  const insertSession = db.prepare(`
    INSERT INTO sessions (
      movie_id,
      cinema_id,
      hall_id,
      date,
      time,
      seats_available,
      language,
      subtitles,
      format
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let inserted = 0;
  let movieIndex = 0;
  const seed = db.transaction(() => {
    for (let d = 0; d <= Math.floor((end - start) / (24 * 60 * 60 * 1000)); d += dayInterval) {
      const dateStr = toIsoDate(addDays(start, d));
      halls.forEach((hall) => {
        times.forEach((time) => {
          const key = `${hall.id}|${dateStr}|${time}`;
          if (existing.has(key)) return;
          const movie = movies[movieIndex % movies.length];
          movieIndex += 1;
          insertSession.run(
            movie.id,
            hall.cinema_id,
            hall.id,
            dateStr,
            time,
            hall.seats,
            'Estonian',
            'English',
            '2D'
          );
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
const end = new Date(2026, 2, 28);
const { inserted } = ensureSessionsEveryFiveDays(start, end);

console.log(`Seeded session rows (every 5 days): ${inserted}`);
