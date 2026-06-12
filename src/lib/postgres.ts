import { Pool } from 'pg';
import { DEPOTS } from './constants';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function initDb() {
  const client = await pool.connect();
  try {
    // Note: Using double quotes for column names to maintain camelCase compatibility with existing code
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE,
        "password" TEXT,
        "name" TEXT,
        "role" TEXT,
        "depotId" TEXT,
        "vatNumber" TEXT,
        "address" TEXT,
        "city" TEXT,
        "zipCode" TEXT,
        "phone" TEXT,
        "contactPerson" TEXT,
        "createdAt" TEXT
      );

      CREATE TABLE IF NOT EXISTS bookings (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users("id"),
        "depotId" TEXT,
        "date" TEXT,
        "time" TEXT,
        "carrierName" TEXT,
        "licensePlate" TEXT,
        "company" TEXT,
        "phone" TEXT,
        "orderRef" TEXT,
        "notes" TEXT,
        "status" TEXT,
        "gateStatus" TEXT,
        "operationType" TEXT,
        "pallets" INTEGER DEFAULT 0,
        "difficulty" TEXT DEFAULT 'standard',
        "attachment" TEXT,
        "arrivalPhoto" TEXT,
        "operationStartedAt" TEXT,
        "completedAt" TEXT,
        "isEmergency" INTEGER DEFAULT 0,
        "createdAt" TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users("id"),
        "createdAt" TEXT
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        "id" SERIAL PRIMARY KEY,
        "userId" TEXT,
        "action" TEXT,
        "details" TEXT,
        "createdAt" TEXT
      );
    `);

    // Migrations
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE users ADD COLUMN "notes" TEXT;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE bookings ADD COLUMN "bay" TEXT;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
        BEGIN
          ALTER TABLE bookings ADD COLUMN "arrivalPhoto" TEXT;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
      END $$;
    `);

    const adminCheck = await client.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    if (parseInt(adminCheck.rows[0].count) === 0) {
      console.log('Seeding initial admin users to PostgreSQL...');
      
      const insertUserSql = `
        INSERT INTO users ("id", "email", "password", "name", "role", "depotId", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      await client.query(insertUserSql, [
        crypto.randomUUID(), 
        'admin@logisticauno.it', 
        'admin', 
        'Super Admin', 
        'admin', 
        null, 
        new Date().toISOString()
      ]);

      for (const depot of DEPOTS) {
        await client.query(insertUserSql, [
          crypto.randomUUID(),
          `${depot.id}@logisticauno.it`,
          'password',
          `Admin ${depot.name}`,
          'admin',
          depot.id,
          new Date().toISOString()
        ]);
      }
    }
  } finally {
    client.release();
  }
}

/**
 * Logga un'azione nel database in modo asincrono e non bloccante.
 * Anche se il log fallisce, l'operazione principale prosegue.
 */
export function logAudit(userId: string | null, action: string, details: any = {}) {
  const sql = `
    INSERT INTO audit_logs ("userId", "action", "details", "createdAt")
    VALUES ($1, $2, $3, $4)
  `;
  
  const values = [
    userId, 
    action, 
    JSON.stringify(details), 
    new Date().toISOString()
  ];

  // Esecuzione non bloccante: non usiamo 'await' e gestiamo l'errore con .catch
  pool.query(sql, values).catch(err => {
    console.error('--- ERRORE AUDIT LOG ---');
    console.error('Azione:', action);
    console.error('Errore:', err.message);
  });
}

export default pool;
