import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "@/db";

async function addFileColumns() {
  try {
    console.log("🔧 Adding evidenceFileKey and audioFileKey columns...");

    // Add columns to anonymous_incident_reports
    await db.execute(sql`
      ALTER TABLE anonymous_incident_reports 
      ADD COLUMN IF NOT EXISTS evidence_file_key TEXT,
      ADD COLUMN IF NOT EXISTS audio_file_key TEXT;
    `);

    console.log("✅ Added columns to anonymous_incident_reports");

    // Add columns to organization_incident_reports
    await db.execute(sql`
      ALTER TABLE organization_incident_reports 
      ADD COLUMN IF NOT EXISTS evidence_file_key TEXT,
      ADD COLUMN IF NOT EXISTS audio_file_key TEXT;
    `);

    console.log("✅ Added columns to organization_incident_reports");
    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Error adding columns:", error);
    process.exit(1);
  }
}

addFileColumns();
