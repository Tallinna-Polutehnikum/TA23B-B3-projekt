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
