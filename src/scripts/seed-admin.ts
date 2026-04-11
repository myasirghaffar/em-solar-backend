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
  const emailRaw = process.env.ADMIN_EMAIL?.trim() || 'admin@energymart.pk';
  const password = process.env.ADMIN_PASSWORD?.trim();
  const name = process.env.ADMIN_NAME?.trim() || 'EnergyMart Admin';

  if (!password) {
    throw new Error(
      'Missing ADMIN_PASSWORD. Add it to .env (see .env.example — not your Supabase database password). ADMIN_EMAIL defaults to admin@energymart.pk when unset.',
    );
  }

  const emailNorm = emailRaw.toLowerCase();

  const sql = createPostgresFromDatabaseUrl(url);
  const db = drizzle(sql, { schema });

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, emailNorm))
    .limit(1);
  if (existing) {
    console.info('Admin user already exists for', emailNorm);
    await sql.end();
    return;
  }

  const hashed = await hashPassword(password);
  await db.insert(schema.users).values({
    name,
    email: emailNorm,
    password: hashed,
    role: UserRole.ADMIN,
    isActive: true,
    emailVerified: true,
  });

  console.info('Admin user created:', emailNorm);
  await sql.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
