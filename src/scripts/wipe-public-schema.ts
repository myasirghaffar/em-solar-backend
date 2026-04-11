import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

/**
 * Drops and recreates the entire `public` schema on Supabase/Postgres.
 * Destroys ALL tables, views, functions, and data in `public`.
 *
 * Uses `DATABASE_URL` from `.env` / `.dev.vars`. Then run: npm run db:push
 */
async function main(): Promise<void> {
  const raw = getMigrateDatabaseUrl();

  const sql = createPostgresFromDatabaseUrl(raw);

  await sql.unsafe('DROP SCHEMA IF EXISTS public CASCADE');
  await sql.unsafe('CREATE SCHEMA public');
  await sql.unsafe(
    'GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role',
  );
  await sql.unsafe('GRANT ALL ON SCHEMA public TO postgres, service_role');
  await sql.unsafe('GRANT ALL ON SCHEMA public TO authenticated, anon');

  console.info('Wiped schema `public` (all old data and objects removed).');
  console.info('Next: npm run db:push');
  await sql.end({ timeout: 10 });
}

void main().catch((e: unknown) => {
  console.error(e);
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: string }).code) : '';
  if (code === '28P01') {
    console.error(
      '\nHint: password auth failed. In Supabase, copy a fresh URI from Settings → Database, reset the DB password if unsure, and URL-encode special characters in the password (e.g. @ → %40). Pooler URIs often use user `postgres.[project-ref]`.\n',
    );
  }
  if (code === 'XX000') {
    const msg = String(e);
    if (msg.includes('Circuit breaker') || msg.includes('upstream database')) {
      console.error(
        '\nHint: Supabase pooler circuit breaker — upstream Postgres unreachable (paused project, overload, etc.). Resume the project in the dashboard, wait a few minutes, or run scripts/apply-api-schema.sql in the Supabase SQL Editor instead of this script.\n',
      );
    }
  }
  process.exit(1);
});
