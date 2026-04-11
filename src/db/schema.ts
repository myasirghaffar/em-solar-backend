import {
  boolean,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/** Matches legacy Sequelize `enum_users_role` for existing databases. */
export const usersRoleEnum = pgEnum('enum_users_role', ['ADMIN', 'USER']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: usersRoleEnum('role').notNull().default('USER'),
  isActive: boolean('isActive').notNull().default(true),
  refreshToken: varchar('refreshToken', { length: 255 }),
  createdAt: timestamp('createdAt', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updatedAt', { withTimezone: true, mode: 'date' })
    .notNull()
    .defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
