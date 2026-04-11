/**
 * Cloudflare Worker bindings (wrangler.toml + secrets + optional Hyperdrive).
 */
export interface Env {
  /** Direct Postgres URL (Neon, Supabase pooler, local). Used when HYPERDRIVE is unset. */
  DATABASE_URL?: string;
  /** Hyperdrive binding — preferred in production. */
  HYPERDRIVE?: Hyperdrive;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRATION?: string;
  JWT_REFRESH_EXPIRATION?: string;
  /** Comma-separated list of allowed CORS origins. */
  ALLOWED_ORIGINS?: string;
}

/** Cloudflare Hyperdrive binding shape. */
export interface Hyperdrive {
  connectionString: string;
}
