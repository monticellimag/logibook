import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Use a singleton db to avoid locking issues in dev
const globalForDb = global as unknown as { sqlite: Database.Database };
const sqlite = globalForDb.sqlite || new Database(path.join(DATA_DIR, 'logibook.db'));

if (process.env.NODE_ENV !== 'production') globalForDb.sqlite = sqlite;

sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });
export * from './schema';
