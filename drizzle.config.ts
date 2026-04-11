import { defineConfig } from 'drizzle-kit';
import { getMigrateDatabaseUrl } from './src/lib/migrate-database-url';
import { loadBackendEnv } from './src/scripts/load-env';

loadBackendEnv();

const raw = getMigrateDatabaseUrl();
const parsed = new URL(raw.replace(/^postgresql:/i, 'https:'));

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: parsed.hostname,
    port: Number(parsed.port || 5432),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.replace(/^\//, '') || 'postgres',
    ssl: { rejectUnauthorized: false },
  },
});
