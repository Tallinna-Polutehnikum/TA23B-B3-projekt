import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
const db = new Database(dbPath);

const rows = db.prepare(`
  SELECT
    st.id AS session_id,
    st.movie_id,
    h.id AS hall_id,
    h.hall_number AS hall_number,
    c.id AS cinema_id,
    strftime('%H:%M', st.date) AS time,
    date(st.date) AS date,
    (
      SELECT COUNT(*) FROM seat s
      WHERE s.hall_id = h.id
    ) - (
      SELECT COUNT(*) FROM ticket t
      WHERE t.session_id = st.id
    ) AS seats_available
  FROM showtime st
  JOIN hall h ON st.hall_id = h.id
  JOIN cinema c ON h.cinema_id = c.id
  ORDER BY st.date
`).all();

const existingRows = db.prepare(`
  SELECT movie_id, cinema_id, hall_id, time, date
  FROM sessions
`).all();

const existing = new Set(
  existingRows.map((r) => `${r.movie_id}|${r.cinema_id}|${r.hall_id}|${r.time}|${r.date}`)
);

const insertSession = db.prepare(`
  INSERT INTO sessions (
    movie_id,
    cinema_id,
    hall_id,
    hall,
    time,
    date,
    seats_available,
    language,
    subtitles,
    format
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

let inserted = 0;
const seed = db.transaction(() => {
  rows.forEach((row) => {
    const key = `${row.movie_id}|${row.cinema_id}|${row.hall_id}|${row.time}|${row.date}`;
    if (existing.has(key)) return;
    insertSession.run(
      row.movie_id,
      row.cinema_id,
      row.hall_id,
      String(row.hall_number),
      row.time,
      row.date,
      row.seats_available,
      'English',
      null,
      '2D'
    );
    existing.add(key);
    inserted += 1;
  });
});

seed();
console.log(`Seeded sessions rows: ${inserted}`);
