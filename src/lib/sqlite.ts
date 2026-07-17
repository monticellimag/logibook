import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DEPOTS } from './constants';

const DATA_DIR = path.join(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const dbPath = path.join(DATA_DIR, 'logibook.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

export function initDb() {
  // Existing init logic remains for now to ensure tables exist
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT,
      depotId TEXT,
      vatNumber TEXT,
      address TEXT,
      city TEXT,
      zipCode TEXT,
      phone TEXT,
      contactPerson TEXT,
      createdAt TEXT
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      userId TEXT,
      depotId TEXT,
      date TEXT,
      time TEXT,
      carrierName TEXT,
      licensePlate TEXT,
      company TEXT,
      phone TEXT,
      orderRef TEXT,
      notes TEXT,
      status TEXT,
      gateStatus TEXT,
      operationType TEXT,
      pallets INTEGER DEFAULT 0,
      difficulty TEXT DEFAULT 'standard',
      attachment TEXT,
      operationStartedAt TEXT,
      completedAt TEXT,
      isEmergency INTEGER DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      userId TEXT,
      createdAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      userId TEXT,
      userEmail TEXT,
      userRole TEXT,
      action TEXT,
      entity TEXT,
      entityId TEXT,
      oldValue TEXT,
      newValue TEXT,
      ipAddress TEXT,
      userAgent TEXT,
      details TEXT
    );

    CREATE TABLE IF NOT EXISTS deposits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT
    );
  `);

  // Add columns if they don't exist (Migrations)
  const migrations = [
    "ALTER TABLE bookings ADD COLUMN arrivalPhoto TEXT",
    "ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'ACTIVE'",
    "ALTER TABLE users ADD COLUMN requested_at TEXT",
    "ALTER TABLE users ADD COLUMN reviewed_at TEXT",
    "ALTER TABLE users ADD COLUMN reviewed_by TEXT",
    "ALTER TABLE users ADD COLUMN rejection_reason TEXT",
    "ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 0",
    "ALTER TABLE users ADD COLUMN temp_password_at TEXT",
    "ALTER TABLE users ADD COLUMN interested_depots TEXT",
    "ALTER TABLE users ADD COLUMN notes TEXT",
    "ALTER TABLE bookings ADD COLUMN bay TEXT"
  ];

  for (const query of migrations) {
    try {
      db.exec(query);
    } catch (e) {
      // Column already exists
    }
  }

  // Seed default users if empty
  const countStmt = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
  
  if (countStmt.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (id, email, password, name, role, depotId, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    db.transaction(() => {
      insertUser.run(crypto.randomUUID(), 'admin@logisticauno.it', 'admin', 'Super Admin', 'admin', null, new Date().toISOString());
      
      DEPOTS.forEach(depot => {
        insertUser.run(
          crypto.randomUUID(),
          `${depot.id}@logisticauno.it`,
          'password',
          `Admin ${depot.name}`,
          'admin',
          depot.id,
          new Date().toISOString()
        );
      });
    })();
  }
}

// Initialize tables and seed on load
initDb();

export default db;

