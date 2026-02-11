import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
const db = new Database(dbPath);

const sessionColumns = db.prepare(`PRAGMA table_info(sessions)`).all();
const hasHallId = sessionColumns.some((col) => col.name === 'hall_id');

if (!hasHallId) {
  console.log('Adding hall_id column to sessions table...');
  db.prepare(`ALTER TABLE sessions ADD COLUMN hall_id INTEGER REFERENCES hall(id)`).run();
}

const halls = db.prepare(`
  SELECT id, hall_number, cinema_id
  FROM hall
`).all();

if (halls.length === 0) {
  console.log('No halls found. Aborting.');
  process.exit(0);
}

const hallsByCinema = new Map();
halls.forEach((hall) => {
  if (!hallsByCinema.has(hall.cinema_id)) {
    hallsByCinema.set(hall.cinema_id, []);
  }
  hallsByCinema.get(hall.cinema_id).push(hall);
});

const fallbackHalls = halls;
const sessions = db.prepare(`
  SELECT id, cinema_id, hall_id, hall
  FROM sessions
`).all();

const updateStmt = db.prepare(`
  UPDATE sessions
  SET hall_id = ?, hall = ?
  WHERE id = ?
`);

let updated = 0;
let skipped = 0;

sessions.forEach((session) => {
  if (session.hall_id) {
    return;
  }

  const pool = hallsByCinema.get(session.cinema_id) ?? fallbackHalls;
  if (!pool.length) {
    skipped += 1;
    return;
  }

  const randomHall = pool[Math.floor(Math.random() * pool.length)];
  const hallLabel = randomHall.hall_number ?? session.hall ?? '1';

  updateStmt.run(randomHall.id, hallLabel, session.id);
  updated += 1;
});

console.log(`Backfill complete. Updated ${updated} sessions. Skipped ${skipped}.`);
