import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ErrorCodes } from '../common/constants/error-codes';
import { HttpStatusCode } from '../common/constants/http-status';
import { SuccessCodes } from '../common/constants/success-messages';
import { createDb } from '../db/client';
import { verifyRefreshToken } from '../lib/jwt';
import { buildErrorResponse, buildSuccessResponse } from '../lib/responses';
import { requireAuth, type AppBindings, type AppVariables } from '../middleware/auth';
import * as authService from '../services/auth.service';
import { loginSchema, refreshSchema, registerSchema } from '../validators/schemas';

export const authRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

authRoutes.post('/register', zValidator('json', registerSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const tokens = await authService.register(db, c.env, body);
  return c.json(buildSuccessResponse(tokens, SuccessCodes.AUTH_REGISTER_SUCCESS));
});

authRoutes.post('/login', zValidator('json', loginSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const tokens = await authService.login(db, c.env, body);
  return c.json(buildSuccessResponse(tokens, SuccessCodes.AUTH_LOGIN_SUCCESS));
});

authRoutes.post('/logout', requireAuth, async (c) => {
  const db = createDb(c.env);
  await authService.logout(db, c.get('auth').sub);
  return c.json(buildSuccessResponse(null, SuccessCodes.AUTH_LOGOUT_SUCCESS));
});

authRoutes.post('/refresh', zValidator('json', refreshSchema), async (c) => {
  const { refreshToken } = c.req.valid('json');
  let payload;
  try {
    payload = await verifyRefreshToken(c.env, refreshToken);
  } catch {
    return c.json(
      buildErrorResponse(ErrorCodes.AUTH_UNAUTHORIZED, HttpStatusCode.UNAUTHORIZED),
      HttpStatusCode.UNAUTHORIZED,
    );
  }
  const db = createDb(c.env);
  const tokens = await authService.refreshTokens(db, c.env, payload.sub, refreshToken);
  return c.json(buildSuccessResponse(tokens, SuccessCodes.AUTH_REFRESH_SUCCESS));
});
