import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('=== Database Check ===');
console.log('Current dir:', __dirname);

// Try different paths
const paths = [
  path.resolve(__dirname, 'database', 'db.sqlite'),
  path.resolve(__dirname, '..', 'database', 'db.sqlite'),
  path.resolve(__dirname, '..', '..', 'database', 'db.sqlite'),
];

console.log('\nTrying paths:');
paths.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));

let db = null;
let usedPath = null;

for (const p of paths) {
  try {
    db = new Database(p);
    usedPath = p;
    console.log(`\n✓ Opened: ${p}`);
    break;
  } catch (err) {
    console.log(`✗ Failed: ${p}`);
    console.log(`  Error: ${err.message}`);
  }
}

if (!db) {
  console.log('\n❌ Could not open database from any path!');
  process.exit(1);
}

// Check tables
console.log('\n=== Tables ===');
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' ORDER BY name
`).all();
console.log(tables.map(t => t.name).join(', '));

// Check movie table
console.log('\n=== Movie Table Info ===');
const columns = db.prepare(`PRAGMA table_info(movie)`).all();
console.log('Columns:');
columns.forEach(col => console.log(`  - ${col.name} (${col.type})`));

// Check data
console.log('\n=== Movie Data Count ===');
const count = db.prepare(`SELECT COUNT(*) as cnt FROM movie`).get();
console.log(`Total movies: ${count.cnt}`);

console.log('\n=== Movies with release_date ===');
const withDate = db.prepare(`SELECT COUNT(*) as cnt FROM movie WHERE release_date IS NOT NULL`).get();
console.log(`With release_date: ${withDate.cnt}`);

console.log('\n=== Coming Soon Movies (future) ===');
const future = db.prepare(`
  SELECT id, title, release_date 
  FROM movie 
  WHERE release_date IS NOT NULL AND DATE(release_date) > DATE('now')
  ORDER BY release_date ASC
  LIMIT 5
`).all();
console.log(`Count: ${future.length}`);
future.forEach(m => console.log(`  - ${m.title} (${m.release_date})`));

console.log('\n=== Sample Full Movie ===');
const sample = db.prepare(`SELECT * FROM movie LIMIT 1`).get();
console.log(JSON.stringify(sample, null, 2));

db.close();
console.log('\n✓ Database check complete');
