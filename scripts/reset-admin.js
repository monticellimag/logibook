const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function reset() {
  const hash = bcrypt.hashSync('admin123', 10);
  try {
    const res = await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@logisticauno.it']);
    console.log('Password reset successfully to: admin123');
  } catch (err) {
    console.error('Error resetting password:', err);
  } finally {
    await pool.end();
  }
}

reset();
