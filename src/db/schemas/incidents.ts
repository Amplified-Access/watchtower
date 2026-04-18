import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { forms } from "./forms";
import { organizations } from "./organizations";
import { user } from "./auth";

export const incidents = pgTable("incidents", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  formId: uuid("form_id").references(() => forms.id).notNull(),
  reportedByUserId: text("reported_by_user_id").references(() => user.id).notNull(),
  data: jsonb("data").notNull(),
  status: text("status").notNull().default('reported'),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});