/**
 * Countries where WatchTower operates
 */

import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const countries = pgTable("countries", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  code: text("code").notNull().unique(), // e.g., 'UG' for Uganda
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
