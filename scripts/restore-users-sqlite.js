const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const dbPath = path.join(__dirname, '../data/slotify.db');
const db = new Database(dbPath);

const usersToRestore = [
  {
    email: 'admin@logisticauno.it',
    password: 'admin123',
    role: 'admin',
    name: 'Super Admin',
    depotId: null
  },
  {
    email: 'gate_monticelli@logisticauno.it',
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

try {
  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');
  const updateUser = db.prepare('UPDATE users SET password = ?, role = ?, depotId = ? WHERE email = ?');
  const insertUser = db.prepare('INSERT INTO users (id, email, password, name, role, depotId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)');

  for (const u of usersToRestore) {
    const hash = bcrypt.hashSync(u.password, 10);
    const existing = checkUser.get(u.email);
    
    if (existing) {
      updateUser.run(hash, u.role, u.depotId, u.email);
      console.log(`Updated user: ${u.email}`);
    } else {
      insertUser.run(crypto.randomUUID(), u.email, hash, u.name, u.role, u.depotId, new Date().toISOString());
      console.log(`Inserted user: ${u.email}`);
    }
  }
  console.log('All done.');
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}
