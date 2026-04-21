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
import { organizations } from "./organizations";
import { user } from "./auth";

export const organizationIncidentReports = pgTable(
  "organization_incident_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    organizationId: uuid("organization_id")
      .references(() => organizations.id)
      .notNull(),

    reportedByUserId: text("reported_by_user_id")
      .references(() => user.id)
      .notNull(),

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

    // Additional fields for organization reports
    severity: text("severity").notNull().default("medium"), // low, medium, high, critical
    verified: boolean("verified").default(false).notNull(),
    verifiedAt: timestamp("verified_at"),
    verifiedByUserId: text("verified_by_user_id").references(() => user.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
);
