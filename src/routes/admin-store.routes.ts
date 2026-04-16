import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { HttpStatusCode } from '../common/constants/http-status';
import { createDb } from '../db/client';
import { ErrorCodes } from '../common/constants/error-codes';
import { buildErrorResponse, buildSuccessResponse } from '../lib/responses';
import { requireAdmin, requireAuth, type AppBindings, type AppVariables } from '../middleware/auth';
import * as catalog from '../services/catalog.service';
import {
  consultationStatusUpdateSchema,
  orderStatusUpdateSchema,
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
  const [products, orders, customers, consultations, analytics] = await Promise.all([
    catalog.listProductsAdmin(db),
    catalog.listOrdersAdmin(db),
    catalog.listCustomersAdmin(db),
    catalog.listConsultationsAdmin(db),
    catalog.getAnalyticsAdmin(db),
  ]);
  return c.json(
    buildSuccessResponse({
      products,
      orders,
      customers,
      consultations,
      analytics,
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
