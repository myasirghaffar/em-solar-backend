/**
 * Run locally (not in the Worker): creates an admin user if missing.
 * Usage: set DATABASE_URL plus ADMIN_EMAIL / ADMIN_PASSWORD in .env (or .dev.vars), then npm run db:seed-admin
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { UserRole } from '../common/constants/roles.enum';
import * as schema from '../db/schema';
import { hashPassword } from '../lib/password';
import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

async function main(): Promise<void> {
  const url = getMigrateDatabaseUrl();
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || 'Admin';

  if (!email || !password) {
    const missing: string[] = [];
    if (!email) missing.push('ADMIN_EMAIL');
    if (!password) missing.push('ADMIN_PASSWORD');
    throw new Error(
      `Missing ${missing.join(' and ')}. Add them to .env or .dev.vars (see .env.example — not your Supabase database password).`,
    );
  }

  const sql = createPostgresFromDatabaseUrl(url);
  const db = drizzle(sql, { schema });

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);
  if (existing) {
    console.info('Admin user already exists for', email);
    await sql.end();
    return;
  }

  const hashed = await hashPassword(password);
  await db.insert(schema.users).values({
    name,
    email,
    password: hashed,
    role: UserRole.ADMIN,
    isActive: true,
  });

  console.info('Admin user created:', email);
  await sql.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
