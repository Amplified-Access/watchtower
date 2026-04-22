import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const incidentTypes = pgTable("incident_type", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
