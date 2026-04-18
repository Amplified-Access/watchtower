import { pgTable, uuid, boolean, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { incidentTypes } from "./incident-types";

export const organizationIncidentTypes = pgTable(
  "organization_incident_types",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .references(() => organizations.id, { onDelete: "cascade" })
      .notNull(),
    incidentTypeId: uuid("incident_type_id")
      .references(() => incidentTypes.id, { onDelete: "cascade" })
      .notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure one record per organization-incident type combination
    uniqueOrgIncidentType: unique().on(
      table.organizationId,
      table.incidentTypeId
    ),
  })
);
