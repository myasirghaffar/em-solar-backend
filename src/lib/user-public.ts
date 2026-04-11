import type { UserRow } from '../db/schema';

export type PublicUser = Omit<UserRow, 'password'>;

export function toPublicUser(row: UserRow | null): PublicUser | null {
  if (!row) {
    return null;
  }
  const { password: _p, ...rest } = row;
  return rest;
}
