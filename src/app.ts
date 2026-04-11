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
import { storeRoutes } from './routes/store.routes';
import { usersRoutes } from './routes/users.routes';

const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

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
