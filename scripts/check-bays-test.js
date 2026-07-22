const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function check() {
  try {
    const res = await pool.query('SELECT * FROM bays');
    console.log('--- Contenuto Tabella BAYS ---');
    console.log(`Numero record trovati: ${res.rows.length}\n`);
    res.rows.forEach(b => {
      console.log(`ID: ${b.id} | Depot: ${b.depositId} | Num: ${b.bayNumber} | Nome: ${b.bayName} | Stato: ${b.status}`);
    });
  } catch (err) {
    console.error('Errore durante la lettura delle baie:', err.message);
  } finally {
    await pool.end();
  }
}

check();
