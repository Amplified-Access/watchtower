// src/db/schema/incident-types.ts

import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";

export const incidentTypes = pgTable("incident_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
  color: text("color").notNull().default("#ef4444"), // Default red color
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
