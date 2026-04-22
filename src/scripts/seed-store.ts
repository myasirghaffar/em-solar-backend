/**
 * Demo catalog + store data for EnergyMart admin flow.
 * Run: npm run db:seed-store (requires DATABASE_URL in .env)
 *
 * Idempotent-ish:
 * - Products: only if the products table is empty (delete rows to re-seed catalog).
 * - Customers: upsert by email (skip if email exists).
 * - Orders / consultations: only if those tables are empty.
 *
 * Create the admin first (same email the storefront uses for dashboard login):
 *   ADMIN_EMAIL=admin@energymart.pk ADMIN_PASSWORD='your-secure-password' npm run db:seed-admin
 */
import { asc, eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';
import type { OrderLineItem } from '../db/schema';

const ADMIN_EMAIL_HINT = 'admin@energymart.pk';
import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

type DemoProduct = {
  name: string;
  category: string;
  price: string;
  stock: number;
  description: string;
  longDescription: string;
  brand: string;
  status: 'active' | 'inactive';
  images: string[];
  specifications: Record<string, string>;
  attachments: { title: string; href: string }[];
};

const DEMO_PRODUCTS: DemoProduct[] = [
  {
    name: 'Monocrystalline Solar Panel 550W',
    category: 'Solar Panels',
    price: '28500',
    stock: 24,
    description:
      'High-efficiency mono PERC module for residential and commercial rooftops.',
    longDescription:
      'Order from EnergyMart.pk for genuine stock, invoice-backed warranty, and nationwide logistics support.',
    brand: 'JA Solar',
    status: 'active',
    images: [
      'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80',
    ],
    specifications: { Power: '550W', Type: 'Monocrystalline' },
    attachments: [],
  },
  {
    name: 'Hybrid Solar Inverter 5kW',
    category: 'Solar Inverters',
    price: '112000',
    stock: 12,
    description: 'MPPT hybrid inverter with grid-tie and battery backup support.',
    longDescription:
      'Pair with approved DC combiners and surge protection for code-compliant string design.',
    brand: 'Growatt',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1613665813446-82a78c468a1d?w=800&q=80'],
    specifications: { Power: '5kW', Phase: 'Single' },
    attachments: [],
  },
  {
    name: 'Lithium Battery 48V 100Ah',
    category: 'Batteries',
    price: '198000',
    stock: 8,
    description: 'Deep-cycle LiFePO₄ pack designed for daily solar cycling.',
    longDescription: 'Designed for daily cycling with solar + backup loads.',
    brand: 'Pylontech',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1620714223084-8fcacc6dfd8d?w=800&q=80'],
    specifications: { Voltage: '48V', Capacity: '100Ah' },
    attachments: [],
  },
  {
    name: 'Roof Mounting Rail Kit',
    category: 'Accessories',
    price: '18500',
    stock: 40,
    description: 'Aluminum rails, clamps, and hardware for tiled roofs.',
    longDescription: 'Complete kit for residential tile roofs.',
    brand: 'SolarMax',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1497435334941-636c87ea4eda?w=800&q=80'],
    specifications: { Material: 'Aluminum' },
    attachments: [],
  },
  {
    name: 'Polycrystalline Panel 450W',
    category: 'Solar Panels',
    price: '22900',
    stock: 32,
    description: 'Cost-effective poly module for larger array installations.',
    longDescription: 'Suitable for utility-scale and large residential arrays.',
    brand: 'Canadian Solar',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&q=80'],
    specifications: { Power: '450W', Type: 'Polycrystalline' },
    attachments: [],
  },
  {
    name: 'DC Combiner Box & Surge Protection',
    category: 'Accessories',
    price: '12400',
    stock: 18,
    description: 'Weatherproof combiner with fuses and SPD for string arrays.',
    longDescription: 'Install between panel strings and combiner inputs.',
    brand: 'SolarMax',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1559302504-64aae6ca364b?w=800&q=80'],
    specifications: { Rating: '32A' },
    attachments: [],
  },
  {
    name: 'WiFi Monitoring Dongle for Inverters',
    category: 'Solar Inverters',
    price: '8900',
    stock: 55,
    description: 'Plug-in module for live production stats on your phone.',
    longDescription: 'Compatible with most hybrid inverter families; check datasheet before purchase.',
    brand: 'Growatt',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1558346548-4438937b318f?w=800&q=80'],
    specifications: { Interface: 'WiFi', App: 'Vendor cloud' },
    attachments: [],
  },
  {
    name: 'Solar DC Cable 4mm² (50m roll)',
    category: 'Accessories',
    price: '11800',
    stock: 60,
    description: 'UV-resistant PV cable for string runs between modules and combiner.',
    longDescription: 'Tinned copper, -40°C to +90°C rating; cut to length on site.',
    brand: 'SolarMax',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&q=80'],
    specifications: { Size: '4mm²', Length: '50m' },
    attachments: [],
  },
  {
    name: 'MC4 Y-Branch Connector Pair',
    category: 'Accessories',
    price: '3200',
    stock: 120,
    description: 'Parallel branch connectors for two strings into one homerun.',
    longDescription: 'IP67 when mated; torque to manufacturer spec.',
    brand: 'Staubli',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&q=80'],
    specifications: { Type: 'Y-branch', Pairs: '1' },
    attachments: [],
  },
  {
    name: 'Monocrystalline Compact Panel 400W',
    category: 'Solar Panels',
    price: '21800',
    stock: 28,
    description: 'Shorter footprint for limited roof space without sacrificing yield.',
    longDescription: 'Half-cut cells reduce mismatch; ideal for residential east/west split roofs.',
    brand: 'Longi',
    status: 'active',
    images: ['https://images.unsplash.com/photo-1611365892117-00ac5ef43c90?w=800&q=80'],
    specifications: { Power: '400W', Type: 'Monocrystalline' },
    attachments: [],
  },
];

const DEMO_PRODUCT_CATEGORIES: { name: string; sortOrder: number }[] = [
  { name: 'Inverter', sortOrder: 1 },
  { name: 'Solar Panels', sortOrder: 2 },
  { name: 'Structure', sortOrder: 3 },
  { name: 'Wires', sortOrder: 4 },
  { name: 'Fitting Items', sortOrder: 5 },
  { name: 'Breakers etc.', sortOrder: 6 },
  { name: 'Battery', sortOrder: 7 },
  { name: 'Service charges', sortOrder: 8 },
  { name: 'Transportation', sortOrder: 9 },
  { name: 'Net-Metering', sortOrder: 10 },
  { name: 'Earthing setup', sortOrder: 11 },
  { name: 'Cloud monitoring', sortOrder: 12 },
  { name: 'Add Manual', sortOrder: 13 },
  // Current demo store categories used by seeded products.
  { name: 'Solar Inverters', sortOrder: 20 },
  { name: 'Batteries', sortOrder: 21 },
  { name: 'Accessories', sortOrder: 22 },
];

const DEMO_CUSTOMERS: {
  name: string;
  email: string;
  phone: string;
  city: string;
}[] = [
  { name: 'Ahmed Khan', email: 'ahmed.khan@example.com', phone: '+92 300 1112233', city: 'Lahore' },
  { name: 'Fatima Noor', email: 'fatima.noor@example.com', phone: '+92 321 4445566', city: 'Karachi' },
  { name: 'Bilal Hussain', email: 'bilal.h@example.com', phone: '+92 333 7778899', city: 'Islamabad' },
  { name: 'Sana Malik', email: 'sana.malik@example.com', phone: '+92 345 0001122', city: 'Faisalabad' },
  { name: 'Omar Sheikh', email: 'omar.sheikh@example.com', phone: '+92 312 9988776', city: 'Multan' },
];

const DEMO_CONSULTATIONS: {
  name: string;
  phone: string;
  city: string;
  monthlyBill: string;
  message: string;
  status: string;
  createdAt: Date;
}[] = [
  {
    name: 'Raza Ali',
    phone: '+92 301 2233445',
    city: 'Rawalpindi',
    monthlyBill: 'Rs. 28,000',
    message: 'Need 8kW hybrid with backup for 2 ACs. Roof is concrete flat.',
    status: 'new',
    createdAt: new Date('2026-03-02T10:00:00Z'),
  },
  {
    name: 'Nadia Iqbal',
    phone: '+92 322 5566778',
    city: 'Lahore',
    monthlyBill: 'Rs. 45,000',
    message: 'Net metering paperwork — can EnergyMart handle DISCO liaison?',
    status: 'contacted',
    createdAt: new Date('2026-03-18T14:30:00Z'),
  },
  {
    name: 'Hassan Tariq',
    phone: '+92 334 8899001',
    city: 'Karachi',
    monthlyBill: 'Rs. 62,000',
    message: 'Commercial warehouse 150kW; request site survey slot next week.',
    status: 'new',
    createdAt: new Date('2026-04-01T09:15:00Z'),
  },
  {
    name: 'Ayesha Rahim',
    phone: '+92 300 3344556',
    city: 'Peshawar',
    monthlyBill: 'Rs. 19,500',
    message: 'Small home 3kW grid-tie only, south-facing roof.',
    status: 'converted',
    createdAt: new Date('2026-02-20T11:45:00Z'),
  },
  {
    name: 'Junaid Farooq',
    phone: '+92 311 6677889',
    city: 'Sialkot',
    monthlyBill: 'Rs. 33,000',
    message: 'Battery expansion for existing Growatt 5kW system.',
    status: 'closed',
    createdAt: new Date('2026-01-12T16:00:00Z'),
  },
];

function buildDemoOrders(catalog: { id: number; name: string; price: string }[]): Omit<
  typeof schema.orders.$inferInsert,
  'id'
>[] {
  const byName = (needle: string) => catalog.find((p) => p.name.includes(needle)) ?? catalog[0];
  const p550 = byName('550W');
  const inv = byName('Inverter 5kW');
  const bat = byName('Battery');
  const rail = byName('Rail');
  const priceNum = (p: { price: string }) => Number(p.price);

  const lines = (
    items: { p: { id: number; name: string; price: string }; qty: number }[],
  ): OrderLineItem[] =>
    items.map(({ p, qty }) => ({
      productId: p.id,
      name: p.name,
      quantity: qty,
      price: priceNum(p),
    }));

  return [
    {
      customerName: 'Ahmed Khan',
      customerEmail: 'ahmed.khan@example.com',
      customerPhone: '+92 300 1112233',
      city: 'Lahore',
      address: '42 Garden Town, near Mall Road',
      notes: 'Call before delivery.',
      paymentMethod: 'cod',
      totalPrice: '132500',
      products: lines([
        { p: p550, qty: 4 },
        { p: rail, qty: 1 },
      ]),
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      createdAt: new Date('2026-02-10T12:00:00Z'),
      updatedAt: new Date('2026-02-12T09:00:00Z'),
    },
    {
      customerName: 'Fatima Noor',
      customerEmail: 'fatima.noor@example.com',
      customerPhone: '+92 321 4445566',
      city: 'Karachi',
      address: 'Plot 18, DHA Phase 5',
      notes: '',
      paymentMethod: 'cod',
      totalPrice: '310000',
      products: lines([
        { p: inv, qty: 1 },
        { p: bat, qty: 1 },
      ]),
      paymentStatus: 'pending',
      orderStatus: 'processing',
      createdAt: new Date('2026-03-22T15:20:00Z'),
      updatedAt: new Date('2026-03-23T08:00:00Z'),
    },
    {
      customerName: 'Bilal Hussain',
      customerEmail: 'bilal.h@example.com',
      customerPhone: '+92 333 7778899',
      city: 'Islamabad',
      address: 'Street 12, G-11/3',
      notes: 'Leave with guard if out.',
      paymentMethod: 'cod',
      totalPrice: '57000',
      products: lines([{ p: p550, qty: 2 }]),
      paymentStatus: 'paid',
      orderStatus: 'shipped',
      createdAt: new Date('2026-04-05T10:00:00Z'),
      updatedAt: new Date('2026-04-06T11:00:00Z'),
    },
    {
      customerName: 'Sana Malik',
      customerEmail: 'sana.malik@example.com',
      customerPhone: '+92 345 0001122',
      city: 'Faisalabad',
      address: 'Millat Road, near ChenOne',
      notes: '',
      paymentMethod: 'cod',
      totalPrice: '12400',
      products: lines([{ p: byName('Combiner'), qty: 1 }]),
      paymentStatus: 'pending',
      orderStatus: 'pending',
      createdAt: new Date('2026-04-08T08:30:00Z'),
      updatedAt: new Date('2026-04-08T08:30:00Z'),
    },
    {
      customerName: 'Omar Sheikh',
      customerEmail: 'omar.sheikh@example.com',
      customerPhone: '+92 312 9988776',
      city: 'Multan',
      address: 'Bosan Road, House 7-C',
      notes: 'Cancelled — changed inverter brand.',
      paymentMethod: 'cod',
      totalPrice: '112000',
      products: lines([{ p: inv, qty: 1 }]),
      paymentStatus: 'pending',
      orderStatus: 'cancelled',
      createdAt: new Date('2026-03-01T13:00:00Z'),
      updatedAt: new Date('2026-03-02T10:00:00Z'),
    },
    {
      customerName: 'EnergyMart Demo Buyer',
      customerEmail: 'demo.buyer@energymart.pk',
      customerPhone: '+92 300 0000007',
      city: 'Lahore',
      address: 'EnergyMart HQ demo address',
      notes: 'Seed order for dashboard testing.',
      paymentMethod: 'cod',
      totalPrice: '50000',
      products: lines([
        { p: byName('400W'), qty: 2 },
        { p: byName('MC4'), qty: 2 },
      ]),
      paymentStatus: 'paid',
      orderStatus: 'delivered',
      createdAt: new Date('2026-04-09T14:00:00Z'),
      updatedAt: new Date('2026-04-10T10:00:00Z'),
    },
  ];
}

async function main(): Promise<void> {
  const url = getMigrateDatabaseUrl();
  const sqlClient = createPostgresFromDatabaseUrl(url);
  const db = drizzle(sqlClient, { schema });

  // Seed product categories (idempotent by name).
  for (const c of DEMO_PRODUCT_CATEGORIES) {
    const [exists] = await db
      .select({ id: schema.productCategories.id })
      .from(schema.productCategories)
      .where(eq(schema.productCategories.name, c.name))
      .limit(1);
    if (exists) continue;
    await db.insert(schema.productCategories).values({
      name: c.name,
      sortOrder: c.sortOrder,
      updatedAt: new Date(),
    });
  }

  const [{ productCount }] = await db
    .select({ productCount: sql<number>`count(*)::int` })
    .from(schema.products);

  if (productCount === 0) {
    await db.insert(schema.products).values(
      DEMO_PRODUCTS.map((row) => ({
        ...row,
        specifications: row.specifications,
      })),
    );
    console.info('Seeded', DEMO_PRODUCTS.length, 'catalog products.');
  } else {
    console.info('Products table already has', productCount, 'row(s); skipping product seed.');
  }

  let insertedCustomers = 0;
  for (const c of DEMO_CUSTOMERS) {
    const emailNorm = c.email.toLowerCase();
    const [exists] = await db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.email, emailNorm))
      .limit(1);
    if (exists) continue;
    await db.insert(schema.customers).values({
      name: c.name,
      email: emailNorm,
      phone: c.phone,
      city: c.city,
    });
    insertedCustomers += 1;
  }
  if (insertedCustomers > 0) {
    console.info('Inserted', insertedCustomers, 'new demo customer(s).');
  } else {
    console.info('Demo customers: all seed emails already exist; skipped.');
  }

  const [{ orderCount }] = await db
    .select({ orderCount: sql<number>`count(*)::int` })
    .from(schema.orders);

  if (orderCount === 0) {
    const catalog = await db
      .select({ id: schema.products.id, name: schema.products.name, price: schema.products.price })
      .from(schema.products)
      .orderBy(asc(schema.products.id));

    if (catalog.length === 0) {
      console.warn('No products in DB; cannot seed orders. Add products first.');
    } else {
      const orders = buildDemoOrders(catalog);
      await db.insert(schema.orders).values(orders);
      console.info('Seeded', orders.length, 'demo orders.');
    }
  } else {
    console.info('Orders table already has', orderCount, 'row(s); skipping order seed.');
  }

  const [{ consultCount }] = await db
    .select({ consultCount: sql<number>`count(*)::int` })
    .from(schema.consultations);

  if (consultCount === 0) {
    await db.insert(schema.consultations).values(
      DEMO_CONSULTATIONS.map((c) => ({
        name: c.name,
        phone: c.phone,
        city: c.city,
        monthlyBill: c.monthlyBill,
        message: c.message,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.createdAt,
      })),
    );
    console.info('Seeded', DEMO_CONSULTATIONS.length, 'demo consultations.');
  } else {
    console.info('Consultations table already has', consultCount, 'row(s); skipping consultation seed.');
  }

  console.info(
    `\nTip: ensure admin login exists:\n  ADMIN_EMAIL=${ADMIN_EMAIL_HINT} ADMIN_PASSWORD='…' npm run db:seed-admin\n`,
  );

  await sqlClient.end();
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
