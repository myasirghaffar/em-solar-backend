-- Run in Supabase → SQL Editor only if you want to wipe the entire public schema
-- (all tables, functions, etc. in public). Then run locally: npm run db:push

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT ALL ON SCHEMA public TO authenticated, anon;
