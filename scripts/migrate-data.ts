import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const SQLITE_PATH = path.join(process.cwd(), 'data', 'logibook.db');
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrateTable(client: any, tableName: string, rows: any[]) {
  if (rows.length === 0) return 0;

  const columns = Object.keys(rows[0]);
  const quotedColumns = columns.map(c => `"${c}"`).join(', ');
  const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
  
  const sql = `INSERT INTO ${tableName} (${quotedColumns}) VALUES (${placeholders}) ON CONFLICT ("id") DO NOTHING`;

  let count = 0;
  for (const row of rows) {
    const values = columns.map(c => row[c]);
    await client.query(sql, values);
    count++;
  }
  return count;
}

async function runMigration() {
  console.log('--- Inizio Migrazione Dati da SQLite a PostgreSQL ---');
  
  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`ERRORE: Database SQLite non trovato in ${SQLITE_PATH}`);
    process.exit(1);
  }

  const sqliteDb = new Database(SQLITE_PATH);
  const client = await pgPool.connect();

  try {
    // 1. Migrazione Users
    console.log('Migrazione tabella: users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    const usersMigrated = await migrateTable(client, 'users', users);
    console.log(`> Migrati ${usersMigrated} utenti.`);

    // 2. Migrazione Bookings
    console.log('Migrazione tabella: bookings...');
    const bookings = sqliteDb.prepare('SELECT * FROM bookings').all();
    const bookingsMigrated = await migrateTable(client, 'bookings', bookings);
    console.log(`> Migrate ${bookingsMigrated} prenotazioni.`);

    // 3. Migrazione Sessions
    console.log('Migrazione tabella: sessions...');
    const sessions = sqliteDb.prepare('SELECT * FROM sessions').all();
    const sessionsMigrated = await migrateTable(client, 'sessions', sessions);
    console.log(`> Migrate ${sessionsMigrated} sessioni.`);

    console.log('\n--- Migrazione completata con successo! ---');
  } catch (error) {
    console.error('ERRORE durante la migrazione:', error);
  } finally {
    sqliteDb.close();
    client.release();
    await pgPool.end();
  }
}

runMigration();
