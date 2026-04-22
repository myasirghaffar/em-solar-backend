-- Incremental migration for existing databases.
-- The first drizzle-kit generate produced a full baseline that fails on DBs that already
-- have `enum_users_role` and core tables. This file only adds `product_categories`.
CREATE TABLE IF NOT EXISTS "product_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(200) NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_categories_name_unique" UNIQUE("name")
);
