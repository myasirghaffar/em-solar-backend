-- ============================================================================
-- EnergyMart / em-solar-api — run in Supabase → SQL Editor → New query → Run
--
-- Use when the dashboard only shows the `users` table: this creates the store
-- tables (`products`, `orders`, `customers`, `consultations`) and seeds demo
-- rows when those tables are still empty.
--
-- Safe to re-run: IF NOT EXISTS / empty-table checks. Does not delete `users`.
-- Alternative from laptop: `npm run db:push` then `npm run db:seed-store`
-- ============================================================================

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

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" boolean NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyToken" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifyExpiresAt" timestamptz;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetToken" varchar(128);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "passwordResetExpiresAt" timestamptz;

-- Primary store admin: verified so login is allowed without email flow
UPDATE "users"
SET
  "emailVerified" = true,
  "emailVerifyToken" = NULL,
  "emailVerifyExpiresAt" = NULL,
  "updatedAt" = now()
WHERE lower(trim("email")) = lower(trim('admin@energymart.pk'));

-- Store catalog (products, orders, customers, consultations)
CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(500) NOT NULL,
  "category" varchar(200) NOT NULL,
  "price" numeric(14, 2) NOT NULL,
  "stock" integer NOT NULL DEFAULT 0,
  "description" text NOT NULL DEFAULT '',
  "longDescription" text,
  "brand" varchar(255),
  "status" varchar(32) NOT NULL DEFAULT 'active',
  "images" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "specifications" jsonb NOT NULL DEFAULT '{}'::jsonb,
  "attachments" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "orders" (
  "id" serial PRIMARY KEY NOT NULL,
  "customerName" varchar(255) NOT NULL,
  "customerPhone" varchar(64) NOT NULL,
  "customerEmail" varchar(255) NOT NULL,
  "city" varchar(128) NOT NULL,
  "address" text NOT NULL,
  "notes" text NOT NULL DEFAULT '',
  "paymentMethod" varchar(64) NOT NULL DEFAULT 'cod',
  "totalPrice" numeric(14, 2) NOT NULL,
  "products" jsonb NOT NULL DEFAULT '[]'::jsonb,
  "paymentStatus" varchar(64) NOT NULL DEFAULT 'pending',
  "orderStatus" varchar(64) NOT NULL DEFAULT 'pending',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "customers" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "phone" varchar(64) NOT NULL,
  "city" varchar(128) NOT NULL,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "customers_email_unique" UNIQUE ("email")
);

CREATE TABLE IF NOT EXISTS "consultations" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "phone" varchar(64) NOT NULL,
  "city" varchar(128) NOT NULL,
  "monthlyBill" varchar(64) NOT NULL DEFAULT '',
  "message" text NOT NULL DEFAULT '',
  "status" varchar(64) NOT NULL DEFAULT 'new',
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Demo seed (products → customers → orders → consultations), idempotent
-- ---------------------------------------------------------------------------
DO $seed$
BEGIN
  -- 10 catalog products (serial ids 1..10 in insert order)
  IF NOT EXISTS (SELECT 1 FROM "products" LIMIT 1) THEN
    INSERT INTO "products" (
      "name", "category", "price", "stock", "description", "longDescription", "brand", "status",
      "images", "specifications", "attachments"
    ) VALUES
    (
      'Monocrystalline Solar Panel 550W', 'Solar Panels', 28500, 24,
      'High-efficiency mono PERC module for residential and commercial rooftops.',
      'Order from EnergyMart.pk for genuine stock, invoice-backed warranty, and nationwide logistics support.',
      'JA Solar', 'active',
      '["https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80"]'::jsonb,
      '{"Power":"550W","Type":"Monocrystalline"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Hybrid Solar Inverter 5kW', 'Solar Inverters', 112000, 12,
      'MPPT hybrid inverter with grid-tie and battery backup support.',
      'Pair with approved DC combiners and surge protection for code-compliant string design.',
      'Growatt', 'active',
      '["https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80"]'::jsonb,
      '{"Power":"5kW","Phase":"Single"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Lithium Battery 48V 100Ah', 'Batteries', 198000, 8,
      'Deep-cycle LiFePO4 pack designed for daily solar cycling.',
      'Designed for daily cycling with solar and backup loads.',
      'Pylontech', 'active',
      '["https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&q=80"]'::jsonb,
      '{"Voltage":"48V","Capacity":"100Ah"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Roof Mounting Rail Kit', 'Accessories', 18500, 40,
      'Aluminum rails, clamps, and hardware for tiled roofs.',
      'Complete kit for residential tile roofs.',
      'SolarMax', 'active',
      '["https://images.unsplash.com/photo-1497435334941-636c87ea4eda?w=800&q=80"]'::jsonb,
      '{"Material":"Aluminum"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Polycrystalline Panel 450W', 'Solar Panels', 22900, 32,
      'Cost-effective poly module for larger array installations.',
      'Suitable for utility-scale and large residential arrays.',
      'Canadian Solar', 'active',
      '["https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80"]'::jsonb,
      '{"Power":"450W","Type":"Polycrystalline"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'DC Combiner Box & Surge Protection', 'Accessories', 12400, 18,
      'Weatherproof combiner with fuses and SPD for string arrays.',
      'Install between panel strings and combiner inputs.',
      'SolarMax', 'active',
      '["https://images.unsplash.com/photo-1559302504-64aae6ca364b?w=800&q=80"]'::jsonb,
      '{"Rating":"32A"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'WiFi Monitoring Dongle for Inverters', 'Solar Inverters', 8900, 55,
      'Plug-in module for live production stats on your phone.',
      'Compatible with most hybrid inverter families; check datasheet before purchase.',
      'Growatt', 'active',
      '["https://images.unsplash.com/photo-1558346548-4438937b318f?w=800&q=80"]'::jsonb,
      '{"Interface":"WiFi","App":"Vendor cloud"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Solar DC Cable 4mm² (50m roll)', 'Accessories', 11800, 60,
      'UV-resistant PV cable for string runs between modules and combiner.',
      'Tinned copper, rated for outdoor PV use; cut to length on site.',
      'SolarMax', 'active',
      '["https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80"]'::jsonb,
      '{"Size":"4mm²","Length":"50m"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'MC4 Y-Branch Connector Pair', 'Accessories', 3200, 120,
      'Parallel branch connectors for two strings into one homerun.',
      'IP67 when mated; torque to manufacturer spec.',
      'Staubli', 'active',
      '["https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80"]'::jsonb,
      '{"Type":"Y-branch","Pairs":"1"}'::jsonb,
      '[]'::jsonb
    ),
    (
      'Monocrystalline Compact Panel 400W', 'Solar Panels', 21800, 28,
      'Shorter footprint for limited roof space without sacrificing yield.',
      'Half-cut cells reduce mismatch; ideal for residential split roofs.',
      'Longi', 'active',
      '["https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&q=80"]'::jsonb,
      '{"Power":"400W","Type":"Monocrystalline"}'::jsonb,
      '[]'::jsonb
    );
    RAISE NOTICE 'Seeded 10 products.';
  ELSE
    RAISE NOTICE 'Products table already has rows; skipped product seed.';
  END IF;

  INSERT INTO "customers" ("name", "email", "phone", "city") VALUES
    ('Ahmed Khan', 'ahmed.khan@example.com', '+92 300 1112233', 'Lahore'),
    ('Fatima Noor', 'fatima.noor@example.com', '+92 321 4445566', 'Karachi'),
    ('Bilal Hussain', 'bilal.h@example.com', '+92 333 7778899', 'Islamabad'),
    ('Sana Malik', 'sana.malik@example.com', '+92 345 0001122', 'Faisalabad'),
    ('Omar Sheikh', 'omar.sheikh@example.com', '+92 312 9988776', 'Multan')
  ON CONFLICT ("email") DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM "orders" LIMIT 1) AND EXISTS (SELECT 1 FROM "products" LIMIT 1) THEN
    INSERT INTO "orders" (
      "customerName", "customerPhone", "customerEmail", "city", "address", "notes",
      "paymentMethod", "totalPrice", "products", "paymentStatus", "orderStatus", "createdAt", "updatedAt"
    ) VALUES
    (
      'Ahmed Khan', '+92 300 1112233', 'ahmed.khan@example.com', 'Lahore',
      '42 Garden Town, near Mall Road', 'Call before delivery.', 'cod', 132500,
      '[
        {"productId":1,"name":"Monocrystalline Solar Panel 550W","quantity":4,"price":28500},
        {"productId":4,"name":"Roof Mounting Rail Kit","quantity":1,"price":18500}
      ]'::jsonb,
      'paid', 'delivered', '2026-02-10T12:00:00Z', '2026-02-12T09:00:00Z'
    ),
    (
      'Fatima Noor', '+92 321 4445566', 'fatima.noor@example.com', 'Karachi',
      'Plot 18, DHA Phase 5', '', 'cod', 310000,
      '[
        {"productId":2,"name":"Hybrid Solar Inverter 5kW","quantity":1,"price":112000},
        {"productId":3,"name":"Lithium Battery 48V 100Ah","quantity":1,"price":198000}
      ]'::jsonb,
      'pending', 'processing', '2026-03-22T15:20:00Z', '2026-03-23T08:00:00Z'
    ),
    (
      'Bilal Hussain', '+92 333 7778899', 'bilal.h@example.com', 'Islamabad',
      'Street 12, G-11/3', 'Leave with guard if out.', 'cod', 57000,
      '[{"productId":1,"name":"Monocrystalline Solar Panel 550W","quantity":2,"price":28500}]'::jsonb,
      'paid', 'shipped', '2026-04-05T10:00:00Z', '2026-04-06T11:00:00Z'
    ),
    (
      'Sana Malik', '+92 345 0001122', 'sana.malik@example.com', 'Faisalabad',
      'Millat Road, near ChenOne', '', 'cod', 12400,
      '[{"productId":6,"name":"DC Combiner Box & Surge Protection","quantity":1,"price":12400}]'::jsonb,
      'pending', 'pending', '2026-04-08T08:30:00Z', '2026-04-08T08:30:00Z'
    ),
    (
      'Omar Sheikh', '+92 312 9988776', 'omar.sheikh@example.com', 'Multan',
      'Bosan Road, House 7-C', 'Cancelled — changed inverter brand.', 'cod', 112000,
      '[{"productId":2,"name":"Hybrid Solar Inverter 5kW","quantity":1,"price":112000}]'::jsonb,
      'pending', 'cancelled', '2026-03-01T13:00:00Z', '2026-03-02T10:00:00Z'
    ),
    (
      'EnergyMart Demo Buyer', '+92 300 0000007', 'demo.buyer@energymart.pk', 'Lahore',
      'EnergyMart HQ demo address', 'Seed order for dashboard testing.', 'cod', 50000,
      '[
        {"productId":10,"name":"Monocrystalline Compact Panel 400W","quantity":2,"price":21800},
        {"productId":9,"name":"MC4 Y-Branch Connector Pair","quantity":2,"price":3200}
      ]'::jsonb,
      'paid', 'delivered', '2026-04-09T14:00:00Z', '2026-04-10T10:00:00Z'
    );
    RAISE NOTICE 'Seeded 6 demo orders.';
  ELSE
    RAISE NOTICE 'Skipped order seed (orders nonempty or no products).';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM "consultations" LIMIT 1) THEN
    INSERT INTO "consultations" (
      "name", "phone", "city", "monthlyBill", "message", "status", "createdAt", "updatedAt"
    ) VALUES
    (
      'Raza Ali', '+92 301 2233445', 'Rawalpindi', 'Rs. 28,000',
      'Need 8kW hybrid with backup for 2 ACs. Roof is concrete flat.', 'new',
      '2026-03-02T10:00:00Z', '2026-03-02T10:00:00Z'
    ),
    (
      'Nadia Iqbal', '+92 322 5566778', 'Lahore', 'Rs. 45,000',
      'Net metering paperwork — can EnergyMart handle DISCO liaison?', 'contacted',
      '2026-03-18T14:30:00Z', '2026-03-18T14:30:00Z'
    ),
    (
      'Hassan Tariq', '+92 334 8899001', 'Karachi', 'Rs. 62,000',
      'Commercial warehouse 150kW; request site survey slot next week.', 'new',
      '2026-04-01T09:15:00Z', '2026-04-01T09:15:00Z'
    ),
    (
      'Ayesha Rahim', '+92 300 3344556', 'Peshawar', 'Rs. 19,500',
      'Small home 3kW grid-tie only, south-facing roof.', 'converted',
      '2026-02-20T11:45:00Z', '2026-02-20T11:45:00Z'
    ),
    (
      'Junaid Farooq', '+92 311 6677889', 'Sialkot', 'Rs. 33,000',
      'Battery expansion for existing Growatt 5kW system.', 'closed',
      '2026-01-12T16:00:00Z', '2026-01-12T16:00:00Z'
    );
    RAISE NOTICE 'Seeded 5 demo consultations.';
  ELSE
    RAISE NOTICE 'Consultations table already has rows; skipped consultation seed.';
  END IF;
END
$seed$;

-- ---------------------------------------------------------------------------
-- Salesman role + leads (quotes / CRM). Safe to re-run.
-- ---------------------------------------------------------------------------
ALTER TYPE enum_users_role ADD VALUE IF NOT EXISTS 'SALESMAN';

CREATE TABLE IF NOT EXISTS "leads" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(255) NOT NULL,
  "contact" varchar(64) NOT NULL,
  "location" varchar(255) NOT NULL,
  "productInterest" varchar(255) NOT NULL DEFAULT 'Solar Panels',
  "status" varchar(64) NOT NULL DEFAULT 'New',
  "notes" text NOT NULL DEFAULT '',
  "assignedToUserId" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "createdByUserId" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "quoteData" jsonb,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "leads_assigned_idx" ON "leads" ("assignedToUserId");
CREATE INDEX IF NOT EXISTS "leads_creator_idx" ON "leads" ("createdByUserId");

-- ---------------------------------------------------------------------------
-- Blog posts (homepage “Latest news” + /news). Managed from admin dashboard.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "blogs" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" varchar(500) NOT NULL,
  "tag" varchar(200) NOT NULL DEFAULT '',
  "imageUrl" text NOT NULL,
  "excerpt" text NOT NULL DEFAULT '',
  "body" text NOT NULL DEFAULT '',
  "isPublished" boolean NOT NULL DEFAULT true,
  "publishedAt" timestamptz NOT NULL DEFAULT now(),
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "blogs_published_idx" ON "blogs" ("isPublished", "publishedAt" DESC);

DO $blogseed$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "blogs" LIMIT 1) THEN
    INSERT INTO "blogs" (
      "title", "tag", "imageUrl", "excerpt", "body", "isPublished", "publishedAt", "createdAt", "updatedAt"
    ) VALUES
    (
      'Strategic Alliance with MCB',
      'AE Power',
      'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80',
      'EnergyMart strengthens financing options for residential solar through a new banking partnership.',
      'We are pleased to announce a strategic alliance that helps homeowners access competitive solar financing.',
      true,
      '2024-07-29T12:00:00Z', '2024-07-29T12:00:00Z', '2024-07-29T12:00:00Z'
    ),
    (
      'Visit to China',
      'AE Power',
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
      'Our team visited manufacturing partners to review next-generation inverter and module lines.',
      'The delegation met with key suppliers and aligned on quality standards for the Pakistan market.',
      true,
      '2024-09-10T10:00:00Z', '2024-09-10T10:00:00Z', '2024-09-10T10:00:00Z'
    ),
    (
      'CSR Activity at AE Power',
      'AE Power',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      'Community outreach and STEM education at our Lahore facility.',
      'Volunteers hosted workshops for students on clean energy careers and rooftop safety.',
      true,
      '2024-08-14T09:00:00Z', '2024-08-14T09:00:00Z', '2024-08-14T09:00:00Z'
    ),
    (
      'Net Metering Guide for Homeowners',
      'Policy',
      'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
      'What to prepare before applying for net metering with your distribution company.',
      'A practical checklist covering load assessment, inverter compatibility, and DISCO paperwork.',
      true,
      '2024-06-01T08:00:00Z', '2024-06-01T08:00:00Z', '2024-06-01T08:00:00Z'
    ),
    (
      'Company Annual Meetup 2024',
      'Culture',
      'https://images.unsplash.com/photo-1542744173-8e7e5348bb03?w=1200&q=80',
      'Teams from Karachi, Lahore, and Islamabad gathered to share wins and roadmap.',
      'Highlights included installer training awards and a preview of new product bundles.',
      true,
      '2024-12-15T14:00:00Z', '2024-12-15T14:00:00Z', '2024-12-15T14:00:00Z'
    );
    RAISE NOTICE 'Seeded 5 demo blog posts.';
  ELSE
    RAISE NOTICE 'Blogs table already has rows; skipped blog seed.';
  END IF;
END
$blogseed$;
