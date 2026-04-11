import { normalizeDatabaseUrl } from './normalize-database-url';

/**
 * `DATABASE_URL` from `.env` / `.dev.vars` for Drizzle CLI, wipe/reset/seed scripts.
 * Use the single Supabase URI Supabase gives you (pooler or session — same variable).
 */
export function getMigrateDatabaseUrl(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) {
    throw new Error(
      'Set DATABASE_URL in em-solar-backend/.env (or .dev.vars). If db:push fails, use scripts/apply-api-schema.sql in the Supabase SQL Editor.',
    );
  }
  return normalizeDatabaseUrl(raw);
}
