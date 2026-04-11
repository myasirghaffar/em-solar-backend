import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { SuccessCodes } from '../common/constants/success-messages';
import { createDb } from '../db/client';
import { buildSuccessResponse } from '../lib/responses';
import { toPublicUser } from '../lib/user-public';
import { requireAdmin, requireAuth, type AppBindings, type AppVariables } from '../middleware/auth';
import * as userService from '../services/user.service';
import { updateUserSchema } from '../validators/schemas';

export const usersRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

usersRoutes.use('*', requireAuth);

usersRoutes.get('/me', async (c) => {
  const db = createDb(c.env);
  const user = await userService.findById(db, c.get('auth').sub);
  return c.json(buildSuccessResponse(toPublicUser(user), SuccessCodes.AUTH_LOGIN_SUCCESS));
});

usersRoutes.get('/:id', requireAdmin, async (c) => {
  const db = createDb(c.env);
  const id = c.req.param('id');
  const user = await userService.findById(db, id);
  return c.json(buildSuccessResponse(toPublicUser(user)));
});

usersRoutes.patch('/:id', requireAdmin, zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const updated = await userService.updateUser(db, id, body);
  return c.json(buildSuccessResponse(toPublicUser(updated)));
});
