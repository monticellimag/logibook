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

async function fix() {
  const client = await pool.connect();
  try {
    console.log('Checking and fixing database schema...');
    
    // Add bay column if missing
    await client.query(`
      DO $$ 
      BEGIN 
        BEGIN
          ALTER TABLE bookings ADD COLUMN "bay" TEXT;
        EXCEPTION
          WHEN duplicate_column THEN null;
        END;
      END $$;
    `);
    
    console.log('Schema fixed successfully!');
  } catch (err) {
    console.error('Failed to fix schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

fix();
