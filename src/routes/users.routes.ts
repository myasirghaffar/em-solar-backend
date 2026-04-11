import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { ErrorCodes } from '../common/constants/error-codes';
import { HttpStatusCode } from '../common/constants/http-status';
import { SuccessCodes } from '../common/constants/success-messages';
import { desc, eq } from 'drizzle-orm';
import { createDb } from '../db/client';
import { customers, orders } from '../db/schema';
import { buildErrorResponse, buildSuccessResponse } from '../lib/responses';
import { customerToFrontend, orderToFrontend } from '../lib/store-mappers';
import { toPublicUser } from '../lib/user-public';
import { requireAdmin, requireAuth, type AppBindings, type AppVariables } from '../middleware/auth';
import * as userService from '../services/user.service';
import { updateUserSchema } from '../validators/schemas';

export const usersRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

usersRoutes.use('*', requireAuth);

usersRoutes.get('/me', async (c) => {
  const db = createDb(c.env);
  const user = await userService.findById(db, c.get('auth').sub);
  const publicUser = toPublicUser(user);
  if (!publicUser) {
    return c.json(
      buildErrorResponse(ErrorCodes.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND),
      HttpStatusCode.NOT_FOUND,
    );
  }
  return c.json(buildSuccessResponse(publicUser, SuccessCodes.USER_ME_SUCCESS));
});

usersRoutes.get('/me/orders', async (c) => {
  const db = createDb(c.env);
  const email = c.get('auth').email.trim().toLowerCase();
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.customerEmail, email))
    .orderBy(desc(orders.id));
  return c.json(buildSuccessResponse(rows.map(orderToFrontend)));
});

usersRoutes.get('/me/customer', async (c) => {
  const db = createDb(c.env);
  const email = c.get('auth').email.trim().toLowerCase();
  const [row] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  return c.json(buildSuccessResponse(row ? customerToFrontend(row) : null));
});

usersRoutes.get('/:id', requireAdmin, async (c) => {
  const db = createDb(c.env);
  const id = c.req.param('id');
  const user = await userService.findById(db, id);
  const publicUser = toPublicUser(user);
  if (!publicUser) {
    return c.json(
      buildErrorResponse(ErrorCodes.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND),
      HttpStatusCode.NOT_FOUND,
    );
  }
  return c.json(buildSuccessResponse(publicUser));
});

usersRoutes.patch('/:id', requireAdmin, zValidator('json', updateUserSchema), async (c) => {
  const id = c.req.param('id');
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const updated = await userService.updateUser(db, id, body);
  return c.json(buildSuccessResponse(toPublicUser(updated)));
});
