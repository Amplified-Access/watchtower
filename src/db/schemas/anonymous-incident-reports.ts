import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { incidentTypes } from "./incident-types";

export const anonymousIncidentReports = pgTable("anonymous_incident_reports", {
  id: uuid("id").defaultRandom().primaryKey(),

  incidentTypeId: uuid("incident_type_id")
    .references(() => incidentTypes.id)
    .notNull(),

  location: jsonb("location").notNull(),

  description: text("description").notNull(),

  entities: text("entities").array().notNull(),

  injuries: integer("injuries").default(0).notNull(),
  fatalities: integer("fatalities").default(0).notNull(),

  evidenceFileKey: text("evidence_file_key"),
  audioFileKey: text("audio_file_key"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
