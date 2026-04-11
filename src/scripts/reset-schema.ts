import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

/**
 * Drops API-owned tables/types so you can run `npm run db:push` for a clean schema.
 * Uses DATABASE_URL (Supabase pooler or direct Postgres URI).
 *
 * WARNING: Deletes all rows in `users`. Run only when you intend to reset.
 */
async function main(): Promise<void> {
  const raw = getMigrateDatabaseUrl();

  const sql = createPostgresFromDatabaseUrl(raw);

  await sql`DROP TABLE IF EXISTS "users" CASCADE`;
  await sql`DROP TYPE IF EXISTS "enum_users_role" CASCADE`;

  console.info('Dropped table "users" and type "enum_users_role" (if they existed).');
  console.info('Next: npm run db:push');
  await sql.end({ timeout: 5 });
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
