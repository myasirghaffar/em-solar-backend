# EM Solar API (Cloudflare Workers)

REST API for the EM Solar project, deployed as a **Cloudflare Worker** using **Hono**, **Drizzle ORM**, and **PostgreSQL**.

## Prerequisites

- Node.js **20+**
- A **PostgreSQL** database (this project is set up for **[Supabase](https://supabase.com/)** Postgres via `DATABASE_URL`)
- [Cloudflare](https://dash.cloudflare.com/) account (for production deploy)

**Supabase MCP (Cursor / Claude):** see [`MCP.md`](./MCP.md).

## Supabase (Postgres for this API)

The Worker and Drizzle talk to Postgres using **`DATABASE_URL`**, not the Supabase REST URL. The **anon** / **service_role** keys in `.env` are for optional Supabase client features later; row data for auth/users lives in Postgres tables managed by Drizzle.

1. In **Supabase Dashboard → Project Settings → Database**, copy the **URI** connection string.
2. Prefer **Transaction** mode (**pooler**, port **6543**) so Cloudflare Workers do not exhaust connection limits.
3. Paste it as the only DB line **`DATABASE_URL`** in **`em-solar-backend/.env`** (and mirror the same value in **`.dev.vars`** for `wrangler dev`). Use the **Transaction pooler** (port **6543**) for Workers; if `db:push` keeps failing on your network, you can instead paste the **Session pooler** URI (same host, port **5432**) as `DATABASE_URL` for local dev only.
4. **Full wipe of all data in `public`:** run **`npm run db:wipe-all`**, then **`npm run db:push`**.  
   Lighter option: **`npm run db:reset-schema`**, or run `scripts/supabase-sql-editor-fresh-start.sql` in the **SQL Editor**.

Also confirm the Supabase project is **not paused** (Dashboard → project status).

**`Circuit breaker open` / `db:push` fails:** Resume the project, wait a few minutes, or run [`scripts/apply-api-schema.sql`](scripts/apply-api-schema.sql) in the **SQL Editor** (no CLI connection). See [Supabase status](https://status.supabase.com/).

**`ENOTFOUND` for `db.*.supabase.co`:** That direct host is often IPv6-only — use a **pooler** URI in `DATABASE_URL` (transaction **6543** or session **5432**), not `db.*`, unless you use Supabase’s IPv4 add-on.

**Security:** Never commit `.env`. If keys were ever shared publicly, rotate them in Supabase (Settings → API) and reset the database password.

## Quick start (local)

1. Install dependencies:

   ```bash
   npm install
   ```

2. Configure environment:

   ```bash
   cp .env.example .env
   ```

   Edit **`.env`**: set **`DATABASE_URL`** (from Supabase), **`JWT_ACCESS_SECRET`**, **`JWT_REFRESH_SECRET`**, and adjust Supabase keys if needed.

   For **`wrangler dev`**, copy the same `DATABASE_URL` and JWT values into **`.dev.vars`** (see `.dev.vars.example`).

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | Single Supabase Postgres URI (pooler: transaction **6543** or session **5432** — URL-encode special chars in the password) |
   | `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Strong random strings |
   | `SUPABASE_*` | Project URL + keys (optional beyond Postgres) |

3. Apply the database schema (reads **`DATABASE_URL`** from **`.env`**):

   ```bash
   npm run db:push
   ```

4. (Optional) Create an admin user:

   ```bash
   export ADMIN_EMAIL="admin@example.com"
   export ADMIN_PASSWORD="your-secure-password"
   export ADMIN_NAME="Admin"
   npm run db:seed-admin
   ```

5. Run the API locally (**Node**, same URL as before — avoids Miniflare + Postgres hangs):

   ```bash
   npm run dev
   ```

   API: `http://127.0.0.1:8787`. Try `GET /health`.

   For **Worker runtime** parity (bindings, limits), use `npm run dev:wrangler` instead — if login or DB calls hang locally, prefer `npm run dev` (Node) for development.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local API on **Node** (port 8787; reliable Postgres TCP) |
| `npm run dev:wrangler` | Local **Cloudflare Worker** (`wrangler dev`) |
| `npm run deploy` | Deploy to Cloudflare |
| `npm run typecheck` | TypeScript check only |
| `npm run db:push` | Push Drizzle schema to the database (good for dev) |
| `npm run db:generate` | Generate SQL migrations from schema changes |
| `npm run db:migrate` | Apply migrations (uses `DATABASE_URL`) |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed-admin` | Insert admin user if missing (local/CI only) |
| `npm run db:reset-schema` | Drop `users` + `enum_users_role` (then run `db:push`) |
| `npm run db:wipe-all` | Drop and recreate entire **`public`** schema (all tables/data; then run `db:push`) |

## Deploy to Railway (Node server)

This repo already includes a Node entrypoint (`src/dev-server.ts`) that runs the same Hono app outside the Workers runtime. Railway can run it directly.

1. Create a new Railway project and connect this repo (or the `em-solar-backend` folder if you are using a monorepo setup).
2. Set these Railway **Environment Variables** (minimum):
   - `DATABASE_URL` (Supabase Postgres URI; **pooler** is recommended)
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
3. Set CORS origins (recommended):
   - `ALLOWED_ORIGINS` = comma-separated list of exact frontend origins (no trailing slash)
4. Deploy. Railway will provide `PORT` automatically; the server binds to `0.0.0.0:$PORT`.

After deploy, verify:
- `GET /health`
- `GET /store/products`

When **`db:push` fails with circuit breaker**, apply schema via **Supabase → SQL Editor** using [`scripts/apply-api-schema.sql`](scripts/apply-api-schema.sql) (no pooler CLI connection required).

## API overview

Base URL is the Worker origin (no `/api` prefix unless you add it in front of the Worker).

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | — | Service info |
| `GET` | `/health` | — | Health check |
| `POST` | `/auth/register` | — | Register |
| `POST` | `/auth/login` | — | Login |
| `POST` | `/auth/logout` | Bearer access token | Clear stored refresh token |
| `POST` | `/auth/refresh` | Bearer access token + JSON `{ "refreshToken" }` | New token pair |
| `GET` | `/users/me` | Bearer access token | Current user (no password) |
| `GET` | `/users/:id` | Admin | User by id |
| `PATCH` | `/users/:id` | Admin | Update user |

Successful responses use the shape:

```json
{
  "success": true,
  "code": "AUTH_LOGIN_SUCCESS",
  "message": "Login successful",
  "data": { }
}
```

Errors:

```json
{
  "success": false,
  "code": "AUTH_INVALID_CREDENTIALS",
  "message": "Invalid credentials",
  "statusCode": 401
}
```

## Deploying to Cloudflare

1. Log in once:

   ```bash
   npx wrangler login
   ```

2. Set **secrets** (not stored in git):

   ```bash
   npx wrangler secret put JWT_ACCESS_SECRET
   npx wrangler secret put JWT_REFRESH_SECRET
   ```

3. **Database connection**

   - **Option A — Hyperdrive (recommended in production):** Create a [Hyperdrive](https://developers.cloudflare.com/hyperdrive/) config in the dashboard pointing at your Postgres host, then uncomment and fill in `[[hyperdrive]]` in `wrangler.toml`. The Worker reads `env.HYPERDRIVE.connectionString`.
   - **Option B — Direct URL:** Store the URL as a secret (Wrangler supports sensitive vars):

     ```bash
     npx wrangler secret put DATABASE_URL
     ```

   For **local** dev, keep using `.dev.vars` with `DATABASE_URL` (and omit Hyperdrive if you are not using it).

4. **CORS:** Set `ALLOWED_ORIGINS` in `wrangler.toml` under `[vars]` or in the Cloudflare dashboard to your **Cloudflare Pages** URL(s), comma-separated, for example:

   ```text
   https://your-app.pages.dev,https://yourdomain.com
   ```

   The default in `wrangler.toml` is `http://localhost:5173` for local frontends.

5. Deploy:

   ```bash
   npm run deploy
   ```

6. Point your Pages app at the Worker URL (e.g. `https://em-solar-api.<account>.workers.dev` or a custom domain behind the same zone).

## Configuration reference

### `wrangler.toml` `[vars]`

| Variable | Description |
|----------|-------------|
| `JWT_ACCESS_EXPIRATION` | Access JWT lifetime (default `15m`) |
| `JWT_REFRESH_EXPIRATION` | Refresh JWT lifetime (default `7d`) |
| `ALLOWED_ORIGINS` | Comma-separated browser origins for CORS |

### Secrets / `.dev.vars`

| Variable | Where |
|----------|--------|
| `JWT_ACCESS_SECRET` | Secret |
| `JWT_REFRESH_SECRET` | Secret |
| `DATABASE_URL` | Secret or `.dev.vars` (if not using Hyperdrive only) |

## Frontend (Cloudflare Pages)

Set your Pages build env or runtime config so the client calls the **Worker base URL**, not `localhost`, in production. Ensure `ALLOWED_ORIGINS` includes your Pages origin so the browser can send `Authorization` and JSON bodies.

## Notes

- **Refresh tokens** are signed with `JWT_REFRESH_SECRET` and hashed with bcrypt before storage. After upgrading from the old Nest app, users should **sign in again** once.
- **Migrations:** Prefer `db:generate` + `db:migrate` for production schema changes; `db:push` is convenient for development.
- **Bundle size:** The Worker uses `nodejs_compat` for `postgres` and `bcryptjs`. If you later optimize for bundle size, consider swapping bcrypt for a Web Crypto–based approach.

## License

MIT
