import { eq } from 'drizzle-orm';
import type { Database } from './client';
import { users, type UserInsert, type UserRow } from './schema';

export async function insertUser(db: Database, data: UserInsert): Promise<UserRow> {
  const [row] = await db.insert(users).values(data).returning();
  if (!row) {
    throw new Error('Failed to create user');
  }
  return row;
}

export async function findUserByEmail(db: Database, email: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

export async function findUserById(db: Database, id: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function findUserByEmailVerifyToken(
  db: Database,
  token: string,
): Promise<UserRow | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.emailVerifyToken, token))
    .limit(1);
  return row ?? null;
}

export async function findUserByPasswordResetToken(
  db: Database,
  token: string,
): Promise<UserRow | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.passwordResetToken, token))
    .limit(1);
  return row ?? null;
}

export type UserPatch = Partial<
  Pick<
    UserRow,
    | 'name'
    | 'email'
    | 'password'
    | 'role'
    | 'isActive'
    | 'refreshToken'
    | 'emailVerified'
    | 'emailVerifyToken'
    | 'emailVerifyExpiresAt'
    | 'passwordResetToken'
    | 'passwordResetExpiresAt'
  >
>;

export async function updateUserById(
  db: Database,
  id: string,
  patch: UserPatch,
): Promise<UserRow | null> {
  const [row] = await db
    .update(users)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return row ?? null;
}
