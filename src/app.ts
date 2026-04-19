import { Hono } from 'hono';
import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import { ErrorCodes } from './common/constants/error-codes';
import { HttpStatusCode } from './common/constants/http-status';
import { AppError } from './lib/app-error';
import { buildErrorResponse } from './lib/responses';
import type { AppBindings, AppVariables } from './middleware/auth';
import { mapDatabaseFaultFromChain } from './lib/map-database-fault';
import { buildStatusDashboardHtml, getApiBootMs } from './lib/status-dashboard';
import { adminStoreRoutes } from './routes/admin-store.routes';
import { authRoutes } from './routes/auth.routes';
import { leadsRoutes } from './routes/leads.routes';
import { storeRoutes } from './routes/store.routes';
import { usersRoutes } from './routes/users.routes';

const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

type RouteMethodHint = { pattern: RegExp; allowed: string[]; template: string };

const routeMethodHints: RouteMethodHint[] = [
  { pattern: /^\/auth\/register$/, allowed: ['POST'], template: '/auth/register' },
  { pattern: /^\/auth\/register-admin$/, allowed: ['POST'], template: '/auth/register-admin' },
  { pattern: /^\/auth\/verify-email$/, allowed: ['POST'], template: '/auth/verify-email' },
  { pattern: /^\/auth\/resend-verification$/, allowed: ['POST'], template: '/auth/resend-verification' },
  { pattern: /^\/auth\/login$/, allowed: ['POST'], template: '/auth/login' },
  { pattern: /^\/auth\/logout$/, allowed: ['POST'], template: '/auth/logout' },
  { pattern: /^\/auth\/refresh$/, allowed: ['POST'], template: '/auth/refresh' },
  { pattern: /^\/auth\/forgot-password$/, allowed: ['POST'], template: '/auth/forgot-password' },
  { pattern: /^\/auth\/reset-password$/, allowed: ['POST'], template: '/auth/reset-password' },

  { pattern: /^\/users\/me$/, allowed: ['GET'], template: '/users/me' },
  { pattern: /^\/users\/me\/orders$/, allowed: ['GET'], template: '/users/me/orders' },
  { pattern: /^\/users\/me\/customer$/, allowed: ['GET'], template: '/users/me/customer' },
  { pattern: /^\/users\/[^/]+$/, allowed: ['GET', 'PATCH'], template: '/users/:id' },

  { pattern: /^\/store\/products$/, allowed: ['GET'], template: '/store/products' },
  { pattern: /^\/store\/products\/[^/]+$/, allowed: ['GET'], template: '/store/products/:id' },
  { pattern: /^\/store\/orders$/, allowed: ['POST'], template: '/store/orders' },
  { pattern: /^\/store\/consultations$/, allowed: ['POST'], template: '/store/consultations' },
  { pattern: /^\/store\/blogs$/, allowed: ['GET'], template: '/store/blogs' },
  { pattern: /^\/store\/blogs\/[^/]+$/, allowed: ['GET'], template: '/store/blogs/:id' },

  { pattern: /^\/admin\/products$/, allowed: ['GET', 'POST'], template: '/admin/products' },
  { pattern: /^\/admin\/products\/[^/]+$/, allowed: ['PATCH', 'PUT', 'DELETE'], template: '/admin/products/:id' },
  { pattern: /^\/admin\/orders$/, allowed: ['GET'], template: '/admin/orders' },
  { pattern: /^\/admin\/orders\/[^/]+$/, allowed: ['PATCH'], template: '/admin/orders/:id' },
  { pattern: /^\/admin\/customers$/, allowed: ['GET'], template: '/admin/customers' },
  { pattern: /^\/admin\/consultations$/, allowed: ['GET'], template: '/admin/consultations' },
  { pattern: /^\/admin\/consultations\/[^/]+$/, allowed: ['PATCH'], template: '/admin/consultations/:id' },
  { pattern: /^\/admin\/analytics$/, allowed: ['GET'], template: '/admin/analytics' },
  { pattern: /^\/admin\/users$/, allowed: ['GET', 'POST'], template: '/admin/users' },
  { pattern: /^\/admin\/users\/[^/]+$/, allowed: ['DELETE'], template: '/admin/users/:id' },
  { pattern: /^\/admin\/sales-team$/, allowed: ['GET', 'POST'], template: '/admin/sales-team' },
  { pattern: /^\/admin\/sales-team\/[^/]+$/, allowed: ['PATCH'], template: '/admin/sales-team/:id' },
  { pattern: /^\/admin\/blogs$/, allowed: ['GET', 'POST'], template: '/admin/blogs' },
  { pattern: /^\/admin\/blogs\/[^/]+$/, allowed: ['PATCH', 'DELETE'], template: '/admin/blogs/:id' },

  { pattern: /^\/leads$/, allowed: ['GET', 'POST'], template: '/leads' },
  { pattern: /^\/leads\/[^/]+$/, allowed: ['GET', 'PATCH', 'DELETE'], template: '/leads/:id' },
];

/** Record isolate boot on first request (correct uptime on status page; see status-dashboard). */
app.use('*', async (_c, next) => {
  getApiBootMs();
  await next();
});

app.use(
  '*',
  cors({
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
    origin: (origin, c) => {
      const raw = c.env.ALLOWED_ORIGINS ?? '';
      const list = raw
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);
      if (list.length === 0 || list.includes('*')) {
        return origin ?? '*';
      }
      if (!origin) {
        return list[0];
      }
      if (list.includes(origin)) {
        return origin;
      }
      return false;
    },
  }),
);

function wantsHtml(c: Context<{ Bindings: AppBindings; Variables: AppVariables }>): boolean {
  const q = c.req.query('format');
  if (q === 'json') return false;
  const accept = c.req.header('Accept') ?? '';
  return accept.includes('text/html');
}

app.get('/', (c) => {
  if (wantsHtml(c)) {
    return c.html(buildStatusDashboardHtml(c.env));
  }
  return c.json({
    name: 'em-solar-api',
    ok: true,
  });
});

app.get('/status', (c) => c.html(buildStatusDashboardHtml(c.env)));

app.get('/health', (c) => c.json({ ok: true }));

app.route('/auth', authRoutes);
app.route('/users', usersRoutes);
app.route('/store', storeRoutes);
app.route('/admin', adminStoreRoutes);
app.route('/leads', leadsRoutes);

app.notFound((c) => {
  const path = c.req.path;
  const method = c.req.method.toUpperCase();
  const hinted = routeMethodHints.find((h) => h.pattern.test(path));

  if (hinted && !hinted.allowed.includes(method)) {
    return c.json(
      buildErrorResponse(
        ErrorCodes.VALIDATION_FAILED,
        HttpStatusCode.METHOD_NOT_ALLOWED,
        `Method ${method} not allowed for ${hinted.template}. Allowed: ${hinted.allowed.join(', ')}.`,
      ),
      HttpStatusCode.METHOD_NOT_ALLOWED as ContentfulStatusCode,
    );
  }

  return c.json(
    buildErrorResponse(
      ErrorCodes.VALIDATION_FAILED,
      HttpStatusCode.NOT_FOUND,
      `Route not found: ${method} ${path}`,
    ),
    HttpStatusCode.NOT_FOUND as ContentfulStatusCode,
  );
});

app.onError((err, c) => {
  if (err instanceof AppError) {
    return c.json(
      buildErrorResponse(err.errorCode, err.statusCode, err.message),
      err.statusCode as ContentfulStatusCode,
    );
  }

  if (err instanceof ZodError) {
    const first = err.errors[0]?.message ?? 'Invalid request';
    return c.json(
      buildErrorResponse(ErrorCodes.VALIDATION_FAILED, HttpStatusCode.BAD_REQUEST, first),
      HttpStatusCode.BAD_REQUEST as ContentfulStatusCode,
    );
  }

  const dbFault = mapDatabaseFaultFromChain(err);
  if (dbFault) {
    console.error('[database]', dbFault.logLabel, err);
    return c.json(
      buildErrorResponse(dbFault.code, dbFault.statusCode),
      dbFault.statusCode as ContentfulStatusCode,
    );
  }

  console.error(err);
  return c.json(
    buildErrorResponse(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      err instanceof Error ? err.message : undefined,
    ),
    HttpStatusCode.INTERNAL_SERVER_ERROR as ContentfulStatusCode,
  );
});

export { app };
