import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { incidents } from "./incidents";

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => user.id)
    .notNull(),
  incidentId: uuid("incident_id").references(() => incidents.id),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
