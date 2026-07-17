// scripts/keepalive.js
// Ping Supabase to prevent the free-tier project from going to sleep.
// Runs via GitHub Actions every 5 days.

const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Add it as a GitHub Secret.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

async function ping() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT NOW() AS time');
    const serverTime = result.rows[0].time;
    console.log(`✅ Supabase is alive! Server time: ${serverTime}`);
  } finally {
    client.release();
    await pool.end();
  }
}

ping().catch((err) => {
  console.error('❌ Keepalive failed:', err.message);
  process.exit(1);
});
