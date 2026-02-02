import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database', 'db.sqlite');

console.log('Opening:', dbPath);
const db = new Database(dbPath);

console.log('\n=== /api/movies/coming-soon ===');
const comingSoon = db.prepare(`
  SELECT id, title, overview, poster, duration
  FROM movie
  WHERE release_date IS NOT NULL AND DATE(release_date) > DATE('now')
  ORDER BY release_date ASC
  LIMIT 10
`).all();
console.log(JSON.stringify(comingSoon, null, 2));

console.log('\n=== /api/gifts ===');
const gifts = db.prepare(`
  SELECT id, name, type, price
  FROM gifts
  ORDER BY price
`).all();
console.log(JSON.stringify(gifts, null, 2));

db.close();
