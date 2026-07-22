const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const usersToRestore = [
  {
    email: 'admin@azienda.it',
    password: 'admin123',
    role: 'admin',
    name: 'Super Admin',
    depotId: null
  },
  {
    email: 'gate_monticelli@azienda.it',
    password: 'password',
    role: 'gate',
    name: 'Hub Monticelli',
    depotId: 'monticelli'
  },
  {
    email: 'vettore_test@logistica.it',
    password: 'password123',
    role: 'user',
    name: 'Vettore Test',
    depotId: null
  }
];

async function restoreUsers() {
  try {
    for (const u of usersToRestore) {
      const hash = bcrypt.hashSync(u.password, 10);
      
      // Check if user exists
      const res = await pool.query('SELECT * FROM users WHERE email = $1', [u.email]);
      
      if (res.rows.length > 0) {
        // Update user
        await pool.query(
          'UPDATE users SET password = $1, role = $2, "depotId" = $3 WHERE email = $4',
          [hash, u.role, u.depotId, u.email]
        );
        console.log(`Updated user: ${u.email}`);
      } else {
        // Insert user
        await pool.query(
          'INSERT INTO users (id, email, password, name, role, "depotId", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [crypto.randomUUID(), u.email, hash, u.name, u.role, u.depotId, new Date().toISOString()]
        );
        console.log(`Inserted user: ${u.email}`);
      }
    }
  } catch (err) {
    console.error('Error restoring users:', err);
  } finally {
    await pool.end();
  }
}

restoreUsers();
