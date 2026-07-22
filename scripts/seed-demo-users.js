/**
 * seed-demo-users.js
 * Popola Supabase con tutti gli utenti demo usati nel pannello quick-login.
 * Uso: node scripts/seed-demo-users.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DEMO_USERS = [
  // ── ADMIN ──────────────────────────────────────────────
  { email: 'admin@logibook.local',           password: 'admin',    name: 'Super Admin',              role: 'admin', depotId: null },
  { email: 'monticelli@azienda.it',     password: 'password', name: 'Admin Monticelli',         role: 'admin', depotId: 'monticelli' },
  { email: 'sangiorgiobi@azienda.it',   password: 'password', name: 'Admin San Giorgio',        role: 'admin', depotId: 'sangiorgiobi' },
  { email: 'oppeano1@azienda.it',       password: 'password', name: 'Admin Oppeano 1',          role: 'admin', depotId: 'oppeano1' },
  { email: 'oppeano2@azienda.it',       password: 'password', name: 'Admin Oppeano 2',          role: 'admin', depotId: 'oppeano2' },
  { email: 'prato@azienda.it',          password: 'password', name: 'Admin Prato',              role: 'admin', depotId: 'prato' },
  { email: 'porcari@azienda.it',        password: 'password', name: 'Admin Porcari',            role: 'admin', depotId: 'porcari' },
  { email: 'caivano@azienda.it',        password: 'password', name: 'Admin Caivano',            role: 'admin', depotId: 'caivano' },
  { email: 'nola@azienda.it',           password: 'password', name: 'Admin Nola',               role: 'admin', depotId: 'nola' },
  { email: 'maddaloni@azienda.it',      password: 'password', name: 'Admin Maddaloni',          role: 'admin', depotId: 'maddaloni' },
  { email: 'bari@azienda.it',           password: 'password', name: 'Admin Bari',               role: 'admin', depotId: 'bari' },
  { email: 'molfetta@azienda.it',       password: 'password', name: 'Admin Molfetta',           role: 'admin', depotId: 'molfetta' },
  { email: 'palermo@azienda.it',        password: 'password', name: 'Admin Palermo',            role: 'admin', depotId: 'palermo' },

  // ── GATE ───────────────────────────────────────────────
  { email: 'gate.monticelli@azienda.it', password: 'password', name: 'Gate Monticelli',         role: 'gate',  depotId: 'monticelli' },
  { email: 'gate.sangiorgiobi@azienda.it', password: 'password', name: 'Gate San Giorgio',      role: 'gate',  depotId: 'sangiorgiobi' },

  // ── VETTORI ────────────────────────────────────────────
  { email: 'LCT@LCT.IT',                    password: 'password', name: 'LCT',                      role: 'user',  depotId: null, status: 'ACTIVE' },
];

const DEPOTS = [
  { id: 'monticelli', name: "Monticelli d'Ongina" },
  { id: 'sangiorgiobi', name: "San Giorgio Bigarello" },
  { id: 'oppeano1', name: "OPPEANO 1" },
  { id: 'oppeano2', name: "Oppeano 2" },
  { id: 'prato', name: "Prato" },
  { id: 'porcari', name: "Porcari" },
  { id: 'caivano', name: "Caivano" },
  { id: 'nola', name: "Nola" },
  { id: 'maddaloni', name: "Maddaloni" },
  { id: 'bari', name: "Bari" },
  { id: 'molfetta', name: "Molfetta" },
  { id: 'palermo', name: "Palermo" },
];

async function seed() {
  console.log('🌱 Avvio seed depositi e utenti demo su Supabase...\n');

  // 1. Inserimento Depositi
  console.log('Popolamento tabella deposits...');
  for (const d of DEPOTS) {
    try {
      const res = await pool.query('SELECT id FROM deposits WHERE id = $1', [d.id]);
      if (res.rows.length === 0) {
        await pool.query('INSERT INTO deposits (id, name) VALUES ($1, $2)', [d.id, d.name]);
        console.log(`  ✅ Inserito deposito: ${d.name} (${d.id})`);
      } else {
        await pool.query('UPDATE deposits SET name = $1 WHERE id = $2', [d.name, d.id]);
      }
    } catch (err) {
      console.error(`  ❌ Errore deposito ${d.id}:`, err.message);
    }
  }

  let inserted = 0;
  let updated = 0;

  for (const u of DEMO_USERS) {
    const hash = bcrypt.hashSync(u.password, 10);
    const now = new Date().toISOString();

    try {
      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);

      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE users SET password = $1, role = $2, "depotId" = $3, name = $4, status = $5 WHERE email = $6`,
          [hash, u.role, u.depotId ?? null, u.name, u.status ?? 'ACTIVE', u.email]
        );
        console.log(`  ✏️  Aggiornato: ${u.email} [${u.role}]`);
        updated++;
      } else {
        await pool.query(
          `INSERT INTO users (id, email, password, name, role, "depotId", status, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [crypto.randomUUID(), u.email, hash, u.name, u.role, u.depotId ?? null, u.status ?? 'ACTIVE', now]
        );
        console.log(`  ✅ Inserito utente:   ${u.email} [${u.role}]`);
        inserted++;
      }
    } catch (err) {
      console.error(`  ❌ Errore utente ${u.email}:`, err.message);
    }
  }

  await pool.end();
  console.log(`\n🎉 Completato! Inseriti: ${inserted} | Aggiornati: ${updated}`);
}

seed();

