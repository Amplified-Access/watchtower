/**
 * Script to create the organization_incident_reports table
 * Run this script to add the missing table to the database
 */

// Load environment variables
import "dotenv/config";

import { db } from "../db/index";
import { sql } from "drizzle-orm";

async function createOrganizationIncidentReportsTable() {
  console.log("🏗️  Creating organization_incident_reports table...");

  try {
    // Create the organization_incident_reports table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "organization_incident_reports" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "organization_id" uuid NOT NULL REFERENCES "organizations"("id"),
        "reported_by_user_id" text NOT NULL REFERENCES "auth_user"("id"),
        "incident_type_id" uuid NOT NULL REFERENCES "incident_types"("id"),
        "location" jsonb NOT NULL,
        "description" text NOT NULL,
        "entities" text[] NOT NULL,
        "injuries" integer NOT NULL DEFAULT 0,
        "fatalities" integer NOT NULL DEFAULT 0,
        "severity" text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        "verified" boolean NOT NULL DEFAULT false,
        "verified_by" text REFERENCES "auth_user"("id"),
        "verified_at" timestamp,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      );
    `);

    console.log("✅ Successfully created organization_incident_reports table");

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_organization_incident_reports_organization_id" 
      ON "organization_incident_reports" ("organization_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_organization_incident_reports_incident_type_id" 
      ON "organization_incident_reports" ("incident_type_id");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_organization_incident_reports_created_at" 
      ON "organization_incident_reports" ("created_at");
    `);

    console.log("✅ Successfully created indexes");
  } catch (error) {
    console.error(
      "❌ Error creating organization_incident_reports table:",
      error
    );
    throw error;
  }
}

// Run the script
if (require.main === module) {
  createOrganizationIncidentReportsTable()
    .then(() => {
      console.log("🎉 Database setup completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Database setup failed:", error);
      process.exit(1);
    });
}

export { createOrganizationIncidentReportsTable };
