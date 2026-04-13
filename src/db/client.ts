import { drizzle } from 'drizzle-orm/postgres-js';
import { ErrorCodes } from '../common/constants/error-codes';
import { HttpStatusCode } from '../common/constants/http-status';
import { AppError } from '../lib/app-error';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import type { Env } from '../types';
import * as schema from './schema';

export type Database = ReturnType<typeof createDb>;

const clients = new Map<string, ReturnType<typeof createPostgresFromDatabaseUrl>>();

function isHyperdriveUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.endsWith('.hyperdrive.local');
  } catch {
    return false;
  }
}

export function getConnectionString(env: Env): string {
  const fromHyperdrive = env.HYPERDRIVE?.connectionString;
  if (fromHyperdrive) {
    return fromHyperdrive;
  }
  if (env.DATABASE_URL?.trim()) {
    return env.DATABASE_URL.trim();
  }
  throw new AppError(ErrorCodes.DATABASE_NOT_CONFIGURED, HttpStatusCode.SERVICE_UNAVAILABLE);
}

/**
 * Single connection per isolate (max: 1) — required pattern for Workers + postgres.js.
 */
export function createDb(env: Env) {
  const url = getConnectionString(env);
  /**
   * Hyperdrive connection handles can be request-scoped in Workers.
   * Reusing a client across requests can throw:
   * "Cannot perform I/O on behalf of a different request".
   */
  if (isHyperdriveUrl(url)) {
    return drizzle(createPostgresFromDatabaseUrl(url), { schema });
  }

  let sql = clients.get(url);
  if (!sql) {
    sql = createPostgresFromDatabaseUrl(url);
    clients.set(url, sql);
  }
  return drizzle(sql, { schema });
}
