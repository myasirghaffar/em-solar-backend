-- Run in Supabase → SQL Editor (whole file).
-- 1) Adds auth/email columns expected by em-solar-api if they are missing.
-- 2) Marks admin@energymart.pk as email-verified and clears pending verification tokens.

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyToken" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyExpiresAt" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" timestamptz;

UPDATE "users"
SET
  "emailVerified" = true,
  "emailVerifyToken" = NULL,
  "emailVerifyExpiresAt" = NULL,
  "updatedAt" = now()
WHERE lower(trim("email")) = lower(trim('admin@energymart.pk'));
