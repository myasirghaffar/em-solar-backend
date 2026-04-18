/**
 * Inserts demo blog rows when `blogs` is empty. Requires DATABASE_URL and existing `blogs` table.
 * Usage: npm run db:seed-blogs
 */
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../db/schema';
import { getMigrateDatabaseUrl } from '../lib/migrate-database-url';
import { createPostgresFromDatabaseUrl } from '../lib/postgres-from-env-url';
import { loadBackendEnv } from './load-env';

loadBackendEnv();

async function main() {
  const url = getMigrateDatabaseUrl();
  const sqlClient = createPostgresFromDatabaseUrl(url, { max: 1 });
  const db = drizzle(sqlClient, { schema });

  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.blogs);
  if (n > 0) {
    console.info(`blogs already has ${n} row(s); nothing to do.`);
    await sqlClient.end({ timeout: 5 });
    return;
  }

  await db.insert(schema.blogs).values([
    {
      title: 'Strategic Alliance with MCB',
      tag: 'AE Power',
      imageUrl:
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=1200&q=80',
      excerpt: 'EnergyMart strengthens financing options for residential solar.',
      body: 'We are pleased to announce a strategic alliance that helps homeowners access competitive solar financing.',
      isPublished: true,
      publishedAt: new Date('2024-07-29T12:00:00Z'),
    },
    {
      title: 'Visit to China',
      tag: 'AE Power',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80',
      excerpt: 'Our team visited manufacturing partners to review next-generation lines.',
      body: 'The delegation met with key suppliers and aligned on quality standards for the Pakistan market.',
      isPublished: true,
      publishedAt: new Date('2024-09-10T10:00:00Z'),
    },
    {
      title: 'CSR Activity at AE Power',
      tag: 'AE Power',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&q=80',
      excerpt: 'Community outreach and STEM education at our Lahore facility.',
      body: 'Volunteers hosted workshops for students on clean energy careers and rooftop safety.',
      isPublished: true,
      publishedAt: new Date('2024-08-14T09:00:00Z'),
    },
    {
      title: 'Net Metering Guide for Homeowners',
      tag: 'Policy',
      imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1200&q=80',
      excerpt: 'What to prepare before applying for net metering.',
      body: 'A practical checklist covering load assessment, inverter compatibility, and DISCO paperwork.',
      isPublished: true,
      publishedAt: new Date('2024-06-01T08:00:00Z'),
    },
    {
      title: 'Company Annual Meetup 2024',
      tag: 'Culture',
      imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e5348bb03?w=1200&q=80',
      excerpt: 'Teams gathered to share wins and roadmap.',
      body: 'Highlights included installer training awards and a preview of new product bundles.',
      isPublished: true,
      publishedAt: new Date('2024-12-15T14:00:00Z'),
    },
  ]);

  console.info('Inserted 5 demo blog posts.');
  await sqlClient.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
