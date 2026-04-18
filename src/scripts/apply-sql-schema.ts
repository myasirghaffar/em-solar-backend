/**
 * Applies `scripts/apply-api-schema.sql` using DATABASE_URL (Supabase / local Postgres).
 * Usage: npm run db:apply-sql-schema
 */
import fs from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

async function main(): Promise<void> {
  const filePath = path.join(process.cwd(), 'scripts', 'apply-api-schema.sql');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${filePath}`);
  }
  const raw = fs.readFileSync(filePath, 'utf8');
  const url = getMigrateDatabaseUrl();
  /** Suppress PostgreSQL NOTICE (seed skips, IF NOT EXISTS, PL/pgSQL RAISE) — still shows errors. */
  const sql = postgres(url, { max: 1, onnotice: () => {} });
  try {
    await sql.unsafe(raw);
    console.info('Applied scripts/apply-api-schema.sql successfully.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
