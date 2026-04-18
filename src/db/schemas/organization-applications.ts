import {
  pgTable,
  text,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

export const organizationApplications = pgTable("organization_applications", {
  id: serial("id").primaryKey(),
  organizationName: text("organization_name").notNull(),
  applicantName: text("applicant_name").notNull(),
  applicantEmail: text("applicant_email").notNull().unique(),
  website: text("website"),
  certificateOfIncorporation: text("certificate_of_incorporation"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
