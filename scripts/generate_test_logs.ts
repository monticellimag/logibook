import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'logibook.db');
const db = new Database(dbPath);

try {
  const insertStmt = db.prepare(`
    INSERT INTO audit_logs (
      userId, userEmail, userRole, action, entity, entityId, 
      oldValue, newValue, ipAddress, userAgent, details, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const userId = 'user-vettore-123';
  const userEmail = 'vettore@logistica.it';
  const role = 'user';
  const ip = '192.168.1.100';
  const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36';

  let timeOffset = 0;
  const getTs = () => new Date(Date.now() + timeOffset++ * 1000).toISOString().replace('T', ' ').slice(0, 19);

  // 1. LOGIN
  insertStmt.run(userId, userEmail, role, 'LOGIN', 'auth', 'session-abc', null, null, ip, ua, 'Accesso effettuato con successo', getTs());

  // 2. CREATE BOOKING
  const newBooking = { id: 'book-xyz', date: '2026-04-23', time: '10:00', carrierName: 'Test Carrier', licensePlate: 'AA123BB' };
  insertStmt.run(userId, userEmail, role, 'CREATE', 'booking', 'book-xyz', null, JSON.stringify(newBooking), ip, ua, 'Nuova prenotazione creata per deposito hub-01', getTs());

  // 3. LOGOUT
  insertStmt.run(userId, userEmail, role, 'LOGOUT', 'auth', 'session-abc', null, null, ip, ua, 'Logout effettuato', getTs());

  console.log('Logs generati con successo!');
} catch (e) {
  console.error(e);
} finally {
  db.close();
}
