import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '..', '..', 'database', 'db.sqlite');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table'").all();
console.log(tables.map((t) => t.name));

const sessionSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='sessions'").get();
const sessionColumns = db.prepare("PRAGMA table_info(sessions)").all();
console.log('sessions schema:', sessionSchema?.sql);
console.log('sessions columns:', sessionColumns.map((c) => `${c.name}:${c.type}`));

const genres = db.prepare("SELECT id, type FROM genres ORDER BY id").all();
console.log('genres:', genres);

const moviesWithGenres = db.prepare(`
	SELECT m.id, m.title, m.genre_id, g.type as genre
	FROM movie m
	LEFT JOIN genres g ON g.id = m.genre_id
	ORDER BY m.updated_at DESC
	LIMIT 20
`).all();
console.log('movies (sample):', moviesWithGenres);
