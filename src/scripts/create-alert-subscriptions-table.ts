/**
 * Script to create the alert_subscriptions table
 * Run this script to add the alert subscriptions functionality to the database
 */

// Load environment variables
import "dotenv/config";

import { db } from "@/db";
import { sql } from "drizzle-orm";

async function createAlertSubscriptionsTable() {
  console.log("🏗️  Creating alert_subscriptions table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "alert_subscriptions" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "name" varchar(255),
        "phone" varchar(20),
        "incident_types" jsonb NOT NULL,
        "locations" jsonb NOT NULL,
        "severity_levels" jsonb NOT NULL,
        "email_notifications" boolean DEFAULT true,
        "sms_notifications" boolean DEFAULT false,
        "alert_frequency" varchar(50) DEFAULT 'immediate',
        "is_active" boolean DEFAULT true,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL,
        "preferred_language" varchar(10) DEFAULT 'en',
        "timezone" varchar(50) DEFAULT 'UTC'
      );
    `);

    console.log("✅ Successfully created alert_subscriptions table");

    // Create indexes for better query performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_alert_subscriptions_email" 
      ON "alert_subscriptions" ("email");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_alert_subscriptions_active" 
      ON "alert_subscriptions" ("is_active");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "idx_alert_subscriptions_created_at" 
      ON "alert_subscriptions" ("created_at");
    `);

    console.log("✅ Successfully created indexes");

    // Insert some sample data for testing
    await db.execute(sql`
      INSERT INTO "alert_subscriptions" (
        "email", 
        "name", 
        "incident_types", 
        "locations", 
        "severity_levels",
        "email_notifications",
        "alert_frequency"
      ) 
      SELECT 
        'test@example.com',
        'Test User',
        '["violence-against-civilians", "riots"]'::jsonb,
        '[{"name": "Kampala, Uganda", "lat": 0.3476, "lon": 32.5825, "radius": 10, "country": "Uganda"}]'::jsonb,
        '["medium", "high", "critical"]'::jsonb,
        true,
        'immediate'
      WHERE NOT EXISTS (
        SELECT 1 FROM "alert_subscriptions" WHERE "email" = 'test@example.com'
      );
    `);

    console.log("✅ Sample subscription added");
  } catch (error) {
    console.error("❌ Error creating alert_subscriptions table:", error);
    throw error;
  }
}

// Run the migration
createAlertSubscriptionsTable()
  .then(() => {
    console.log("Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    process.exit(1);
  });
