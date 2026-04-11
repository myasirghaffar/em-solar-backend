import postgres from 'postgres';
import { normalizeDatabaseUrl } from './normalize-database-url';

/**
 * Build a postgres.js client from DATABASE_URL without mis-parsing special
 * characters in passwords (use URL decoding instead of relying on the URI alone).
 */
export function createPostgresFromDatabaseUrl(urlString: string) {
  const normalized = normalizeDatabaseUrl(urlString);
  const parsed = new URL(normalized);

  const password = decodeURIComponent(parsed.password);
  const user = decodeURIComponent(parsed.username);
  const host = parsed.hostname;
  const port = parsed.port ? Number(parsed.port) : 5432;
  const database = parsed.pathname.replace(/^\//, '') || 'postgres';

  return postgres({
    host,
    port,
    database,
    user,
    password,
    ssl: { rejectUnauthorized: false },
    max: 1,
    prepare: false,
    fetch_types: false,
    /** Avoid indefinite hangs when the pooler / network is unreachable (esp. local Wrangler). */
    connect_timeout: 15,
  });
}
