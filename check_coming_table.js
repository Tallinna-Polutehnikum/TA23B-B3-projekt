import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'database', 'db.sqlite');

const db = new Database(dbPath);

console.log('=== comingsoon_movies table ===');
const columns = db.prepare(`PRAGMA table_info(comingsoon_movies)`).all();
console.log('Columns:');
columns.forEach(col => console.log(`  ${col.name} (${col.type})`));

console.log('\n=== Data in comingsoon_movies ===');
const data = db.prepare(`SELECT * FROM comingsoon_movies LIMIT 10`).all();
console.log(`Count: ${data.length}`);
console.log(JSON.stringify(data, null, 2));

db.close();
