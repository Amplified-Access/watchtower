import { user } from "./auth";
import { organizations } from "./organizations";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const reports = pgTable("reports", {
  // A unique identifier for the report.
  id: uuid("id").defaultRandom().primaryKey(),

  // The organization that published the report. This is a foreign key.
  organizationId: uuid("organization_id")
    .references(() => organizations.id)
    .notNull(),

  // The user who created the report. This is a foreign key.
  reportedById: text("reported_by_user_id")
    .references(() => user.id)
    .notNull(),

  // The title of the report, as it appears in the publication.
  title: text("title").notNull(),

  // The unique key for the report file in Cloudflare R2.
  fileKey: text("file_key").notNull(),

  // The current publication status of the report (e.g., 'draft', 'published').
  status: text("status").notNull().default("draft"),

  // Timestamps for tracking creation and updates.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
