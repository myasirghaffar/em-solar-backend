-- Run in Supabase → SQL Editor when `npm run db:push` fails with
-- "Circuit breaker open" or connection errors (pooler cannot reach Postgres).
-- Safe to re-run: skips existing enum / table.

DO $$
BEGIN
  CREATE TYPE "enum_users_role" AS ENUM ('ADMIN', 'USER');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END
$$;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "password" varchar(255) NOT NULL,
  "role" "enum_users_role" NOT NULL DEFAULT 'USER'::"enum_users_role",
  "isActive" boolean NOT NULL DEFAULT true,
  "refreshToken" varchar(255),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "users_email_unique" UNIQUE ("email")
);
