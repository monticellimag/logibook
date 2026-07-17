import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local in development
const envLocalPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const parsed = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const key in parsed) {
    process.env[key] = parsed[key];
  }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
