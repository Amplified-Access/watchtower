import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { incidentTypes } from "./incident-types";

export const organizationIncidentReports = pgTable("organization_incident_report", {
  id: text("id").primaryKey(),
  incidentTypeId: text("incident_type_id").references(() => incidentTypes.id),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});
