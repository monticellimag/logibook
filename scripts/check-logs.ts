import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'logibook.db');
const db = new Database(dbPath);

interface AuditLog {
  timestamp: string;
  action: string;
  entity: string;
  userEmail: string;
  details: string;
}

try {
  const logs = db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 5').all() as AuditLog[];
  console.log('\n--- ULTIMI 5 LOG DI AUDIT ---');
  if (logs.length === 0) {
    console.log('Nessun log trovato.');
  } else {
    logs.forEach(log => {
      console.log(`[${log.timestamp}] ${log.action} - ${log.entity} (User: ${log.userEmail})`);
      console.log(`Dettagli: ${log.details}`);
      console.log('---');
    });
  }
} catch (err) {
  console.error('Errore durante la lettura dei log:', err);
} finally {
  db.close();
}
