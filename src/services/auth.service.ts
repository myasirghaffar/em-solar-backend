import { ErrorCodes } from '../common/constants/error-codes';
import { HttpStatusCode } from '../common/constants/http-status';
import { UserRole } from '../common/constants/roles.enum';
import type { Database } from '../db/client';
import type { Env } from '../types';
import { AppError } from '../lib/app-error';
import { comparePassword, hashPassword } from '../lib/password';
import { generateTokens, type GeneratedTokens } from '../lib/jwt';
import * as userService from './user.service';

export async function register(
  db: Database,
  env: Env,
  input: { name: string; email: string; password: string },
): Promise<GeneratedTokens> {
  const created = await userService.createUser(db, input);
  return generateAndStoreTokens(
    db,
    env,
    created.id,
    created.email,
    created.role as UserRole,
  );
}

export async function login(
  db: Database,
  env: Env,
  input: { email: string; password: string },
): Promise<GeneratedTokens> {
  const user = await userService.findByEmail(db, input.email);
  if (!user) {
    throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, HttpStatusCode.UNAUTHORIZED);
  }

  const ok = await comparePassword(input.password, user.password);
  if (!ok) {
    throw new AppError(ErrorCodes.AUTH_INVALID_CREDENTIALS, HttpStatusCode.UNAUTHORIZED);
  }

  return generateAndStoreTokens(db, env, user.id, user.email, user.role as UserRole);
}

export async function logout(db: Database, userId: string): Promise<void> {
  await userService.setRefreshTokenHash(db, userId, null);
}

export async function refreshTokens(
  db: Database,
  env: Env,
  userId: string,
  refreshTokenPlain: string,
): Promise<GeneratedTokens> {
  const user = await userService.findById(db, userId);
  if (!user?.refreshToken) {
    throw new AppError(ErrorCodes.AUTH_REFRESH_TOKEN_MISSING, HttpStatusCode.UNAUTHORIZED);
  }

  const valid = await comparePassword(refreshTokenPlain, user.refreshToken);
  if (!valid) {
    throw new AppError(ErrorCodes.AUTH_REFRESH_TOKEN_INVALID, HttpStatusCode.UNAUTHORIZED);
  }

  return generateAndStoreTokens(db, env, user.id, user.email, user.role as UserRole);
}

async function generateAndStoreTokens(
  db: Database,
  env: Env,
  userId: string,
  email: string,
  role: UserRole,
): Promise<GeneratedTokens> {
  const tokens = await generateTokens(env, { userId, email, role });
  const hashedRefresh = await hashPassword(tokens.refreshToken);
  await userService.setRefreshTokenHash(db, userId, hashedRefresh);
  return tokens;
}
