/**
 * Creates a verified salesman user if missing. Run after migrations / apply-api-schema.
 * Usage: DATABASE_URL + SALESMAN_EMAIL / SALESMAN_PASSWORD in .env — npm run db:seed-salesman
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

/** Ensures DB enum includes SALESMAN (existing DBs often only have ADMIN/USER until migration runs). */
async function ensureSalesmanEnumValue(
  sql: ReturnType<typeof createPostgresFromDatabaseUrl>,
): Promise<void> {
  try {
    await sql.unsafe(`ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'SALESMAN'`);
    return;
  } catch {
    /* PG < 15: no IF NOT EXISTS — fall through */
  }
  try {
    await sql.unsafe(`ALTER TYPE enum_users_role ADD VALUE 'SALESMAN'`);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    const code = (e as { code?: string })?.code;
    if (
      code === '42710' ||
      msg.includes('already exists') ||
      /duplicate/i.test(msg)
    ) {
      return;
    }
    throw e;
  }
}

async function main(): Promise<void> {
  const url = getMigrateDatabaseUrl();
  const emailRaw = process.env.SALESMAN_EMAIL?.trim() || 'sales@energymart.pk';
  const password = process.env.SALESMAN_PASSWORD?.trim() || 'Sales@123';
  const name = process.env.SALESMAN_NAME?.trim() || 'EnergyMart Sales';

  const emailNorm = emailRaw.toLowerCase();

  const sql = createPostgresFromDatabaseUrl(url);
  await ensureSalesmanEnumValue(sql);

  const db = drizzle(sql, { schema });

  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, emailNorm))
    .limit(1);
  if (existing) {
    console.info('User already exists for', emailNorm, '— skipping salesman seed');
    await sql.end();
    return;
  }

  const hashed = await hashPassword(password);
  await db.insert(schema.users).values({
    name,
    email: emailNorm,
    password: hashed,
    role: UserRole.SALESMAN,
    isActive: true,
    emailVerified: true,
  });

  console.info('Salesman user created:', emailNorm, '(role SALESMAN)');
  await sql.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
