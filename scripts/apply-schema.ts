import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrationSql = fs.readFileSync(path.join(process.cwd(), 'drizzle', '0000_clear_cable.sql'), 'utf8');

async function apply() {
  const client = await pool.connect();
  try {
    console.log('Applying schema to Supabase...');
    // Split by statement-breakpoint
    const statements = migrationSql.split('--> statement-breakpoint');
    for (let statement of statements) {
      if (statement.trim()) {
        await client.query(statement);
      }
    }
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Failed to apply schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

apply();
