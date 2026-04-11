import { Hono } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { cors } from 'hono/cors';
import { ZodError } from 'zod';
import { ErrorCodes } from './common/constants/error-codes';
import { HttpStatusCode } from './common/constants/http-status';
import { AppError } from './lib/app-error';
import { buildErrorResponse } from './lib/responses';
import type { AppBindings, AppVariables } from './middleware/auth';
import { authRoutes } from './routes/auth.routes';
import { usersRoutes } from './routes/users.routes';

const app = new Hono<{ Bindings: AppBindings; Variables: AppVariables }>();

app.use(
  '*',
  cors({
    allowHeaders: ['Authorization', 'Content-Type'],
    allowMethods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
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

app.get('/', (c) =>
  c.json({
    name: 'em-solar-api',
    ok: true,
  }),
);

app.get('/health', (c) => c.json({ ok: true }));

app.route('/auth', authRoutes);
app.route('/users', usersRoutes);

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
