/**
 * Run the API on Node (default `npm run dev`) so Postgres over TCP works reliably.
 * `wrangler dev` + Miniflare often hangs on outbound DB connections with postgres.js.
 */
import { serve } from '@hono/node-server';
import { loadBackendEnv } from './scripts/load-env';
import type { Env } from './types';
import app from './index';

loadBackendEnv();

function buildEnv(): Env {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  const access = process.env.JWT_ACCESS_SECRET?.trim();
  const refresh = process.env.JWT_REFRESH_SECRET?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Set it in em-solar-backend/.env');
  }
  if (!access || !refresh) {
    throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required in .env');
  }

  return {
    DATABASE_URL: databaseUrl,
    IS_NODE_SERVER: 'true',
    DB_POOL_MAX: process.env.DB_POOL_MAX,
    JWT_ACCESS_SECRET: access,
    JWT_REFRESH_SECRET: refresh,
    JWT_ACCESS_EXPIRATION: process.env.JWT_ACCESS_EXPIRATION,
    JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    FRONTEND_APP_URL: process.env.FRONTEND_APP_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
    DEV_EXPOSE_EMAIL_LINKS: process.env.DEV_EXPOSE_EMAIL_LINKS,
    ADMIN_INVITE_SECRET: process.env.ADMIN_INVITE_SECRET,
    ENVIRONMENT: process.env.ENVIRONMENT,
    DEPLOYED_AT: process.env.DEPLOYED_AT,
    BUILD_TIME: process.env.BUILD_TIME,
    GIT_COMMIT: process.env.GIT_COMMIT,
    GIT_COMMIT_SHORT: process.env.GIT_COMMIT_SHORT,
    WORKER_COMPAT_DATE: process.env.WORKER_COMPAT_DATE,
  };
}

const env = buildEnv();
const port = Number(process.env.PORT) || 8787;
const hostname = process.env.HOST?.trim() || '0.0.0.0';

serve({
  hostname,
  port,
  fetch: (req) => app.fetch(req, env),
});

const hostForLog = hostname === '0.0.0.0' ? 'localhost' : hostname;
console.info(`em-solar-api (Node) http://${hostForLog}:${port} — using .env / .dev.vars`);
if (!process.env.RESEND_API_KEY?.trim() || !process.env.EMAIL_FROM?.trim()) {
  console.info(
    '[email] RESEND_API_KEY + EMAIL_FROM are not both set — verification emails are not sent; register/forgot responses include a "devVerificationUrl" / "devResetUrl" link instead.',
  );
}
