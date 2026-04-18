import {
  pgTable,
  text,
  timestamp,
  jsonb,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const forms = pgTable("forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),
  name: text("name").notNull(),
  definition: jsonb("definition").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
