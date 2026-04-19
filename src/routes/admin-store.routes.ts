import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HttpStatusCode } from '../common/constants/http-status';
import { UserRole } from '../common/constants/roles.enum';
import { createDb } from '../db/client';
import * as usersRepo from '../db/users.repo';
import { ErrorCodes } from '../common/constants/error-codes';
import { buildErrorResponse, buildSuccessResponse } from '../lib/responses';
import { ensureSalesmanEnumValue } from '../lib/ensure-salesman-enum';
import { toPublicUser } from '../lib/user-public';
import { requireAdmin, requireAuth, type AppBindings, type AppVariables } from '../middleware/auth';
import * as catalog from '../services/catalog.service';
import * as userService from '../services/user.service';
import {
  blogCreateSchema,
  blogUpdateSchema,
  consultationStatusUpdateSchema,
  createAdminUserSchema,
  createSalesmanSchema,
  orderStatusUpdateSchema,
  patchSalesmanSchema,
  productCreateSchema,
  productUpdateSchema,
} from '../validators/schemas';

export const adminStoreRoutes = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

adminStoreRoutes.use('*', requireAuth);
adminStoreRoutes.use('*', requireAdmin);

/**
 * Admin UI bootstrap: fetch everything the admin dashboard commonly needs in one request.
 * This reduces request waterfalls / browser connection contention vs 4–5 separate calls.
 */
adminStoreRoutes.get('/bootstrap', async (c) => {
  const db = createDb(c.env);
  const [products, orders, customers, consultations, analytics, blogs] = await Promise.all([
    catalog.listProductsAdmin(db),
    catalog.listOrdersAdmin(db),
    catalog.listCustomersAdmin(db),
    catalog.listConsultationsAdmin(db),
    catalog.getAnalyticsAdmin(db),
    catalog.listBlogsAdmin(db),
  ]);
  return c.json(
    buildSuccessResponse({
      products,
      orders,
      customers,
      consultations,
      analytics,
      blogs,
    }),
  );
});

adminStoreRoutes.get('/products', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listProductsAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.post('/products', zValidator('json', productCreateSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const data = await catalog.createProductAdmin(db, body);
  return c.json(buildSuccessResponse(data), HttpStatusCode.CREATED);
});

adminStoreRoutes.patch('/products/:id', zValidator('json', productUpdateSchema), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid product id'),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const data = await catalog.updateProductAdmin(db, id, body);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.put('/products/:id', zValidator('json', productCreateSchema), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid product id'),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const data = await catalog.updateProductAdmin(db, id, body);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.delete('/products/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid product id'),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const db = createDb(c.env);
  await catalog.deleteProductAdmin(db, id);
  return c.json(buildSuccessResponse(null), HttpStatusCode.OK);
});

adminStoreRoutes.get('/orders', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listOrdersAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.patch(
  '/orders/:id',
  zValidator('json', orderStatusUpdateSchema),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id) || id < 1) {
      return c.json(
        buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid order id'),
        HttpStatusCode.BAD_REQUEST,
      );
    }
    const { order_status } = c.req.valid('json');
    const db = createDb(c.env);
    const data = await catalog.updateOrderStatusAdmin(db, id, order_status);
    return c.json(buildSuccessResponse(data));
  },
);

adminStoreRoutes.get('/customers', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listCustomersAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.get('/consultations', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listConsultationsAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.patch(
  '/consultations/:id',
  zValidator('json', consultationStatusUpdateSchema),
  async (c) => {
    const id = Number(c.req.param('id'));
    if (!Number.isFinite(id) || id < 1) {
      return c.json(
        buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid id'),
        HttpStatusCode.BAD_REQUEST,
      );
    }
    const { status } = c.req.valid('json');
    const db = createDb(c.env);
    const data = await catalog.updateConsultationStatusAdmin(db, id, status);
    return c.json(buildSuccessResponse(data));
  },
);

adminStoreRoutes.get('/analytics', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.getAnalyticsAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.get('/blogs', async (c) => {
  const db = createDb(c.env);
  const data = await catalog.listBlogsAdmin(db);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.post('/blogs', zValidator('json', blogCreateSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const data = await catalog.createBlogAdmin(db, body);
  return c.json(buildSuccessResponse(data), HttpStatusCode.CREATED);
});

adminStoreRoutes.patch('/blogs/:id', zValidator('json', blogUpdateSchema), async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid blog id'),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const body = c.req.valid('json');
  const db = createDb(c.env);
  const data = await catalog.updateBlogAdmin(db, id, body);
  return c.json(buildSuccessResponse(data));
});

adminStoreRoutes.delete('/blogs/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id) || id < 1) {
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, 'Invalid blog id'),
      HttpStatusCode.BAD_REQUEST,
    );
  }
  const db = createDb(c.env);
  await catalog.deleteBlogAdmin(db, id);
  return c.json(buildSuccessResponse(null));
});

adminStoreRoutes.get('/users', async (c) => {
  const db = createDb(c.env);
  const rows = await usersRepo.listAllUsers(db);
  return c.json(buildSuccessResponse(rows.map((u) => toPublicUser(u)).filter(Boolean)));
});

adminStoreRoutes.post('/users', zValidator('json', createAdminUserSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  if (body.role === UserRole.SALESMAN) {
    await ensureSalesmanEnumValue(db);
  }
  const created = await userService.createUser(db, {
    name: body.name,
    email: body.email,
    password: body.password,
    role: body.role,
    emailVerified: true,
  });
  return c.json(buildSuccessResponse(toPublicUser(created)), HttpStatusCode.CREATED);
});

adminStoreRoutes.delete('/users/:id', async (c) => {
  const id = c.req.param('id');
  const db = createDb(c.env);
  await userService.deleteUserAsAdmin(db, id, c.get('auth').sub);
  return c.json(buildSuccessResponse(null));
});

adminStoreRoutes.get('/sales-team', async (c) => {
  const db = createDb(c.env);
  await ensureSalesmanEnumValue(db);
  const rows = await usersRepo.listUsersByRole(db, UserRole.SALESMAN);
  return c.json(buildSuccessResponse(rows.map((u) => toPublicUser(u)).filter(Boolean)));
});

adminStoreRoutes.post('/sales-team', zValidator('json', createSalesmanSchema), async (c) => {
  const body = c.req.valid('json');
  const db = createDb(c.env);
  await ensureSalesmanEnumValue(db);
  const created = await userService.createUser(db, {
    name: body.name,
    email: body.email,
    password: body.password,
    role: UserRole.SALESMAN,
    emailVerified: true,
  });
  return c.json(buildSuccessResponse(toPublicUser(created)), HttpStatusCode.CREATED);
});

adminStoreRoutes.patch(
  '/sales-team/:id',
  zValidator('json', patchSalesmanSchema),
  async (c) => {
    const id = c.req.param('id');
    const body = c.req.valid('json');
    const db = createDb(c.env);
    await ensureSalesmanEnumValue(db);
    const existing = await usersRepo.findUserById(db, id);
    if (!existing || existing.role !== UserRole.SALESMAN) {
      return c.json(
        buildErrorResponse(ErrorCodes.USER_NOT_FOUND, HttpStatusCode.NOT_FOUND),
        HttpStatusCode.NOT_FOUND,
      );
    }
    const updated = await userService.updateUser(db, id, body);
    return c.json(buildSuccessResponse(toPublicUser(updated)));
  },
);
