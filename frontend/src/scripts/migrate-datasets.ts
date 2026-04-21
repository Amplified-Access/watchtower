import { db } from "@/db";
import { sql } from "drizzle-orm";

async function createDatasetsTable() {
  console.log("🔧 Creating datasets table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "datasets" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "description" text NOT NULL,
        "category" varchar(100) NOT NULL,
        "tags" text[],
        "file_key" varchar(255) NOT NULL,
        "file_name" varchar(255) NOT NULL,
        "file_size" integer NOT NULL,
        "file_type" varchar(50) NOT NULL,
        "download_count" integer DEFAULT 0,
        "is_public" boolean DEFAULT true,
        "published_at" timestamp DEFAULT now(),
        "updated_at" timestamp DEFAULT now(),
        "created_at" timestamp DEFAULT now(),
        "source" varchar(255),
        "license" varchar(100) DEFAULT 'CC BY 4.0',
        "version" varchar(20) DEFAULT '1.0',
        "coverage" varchar(255),
        "format" varchar(50) NOT NULL,
        "keywords" text[],
        "methodology" text
      );
    `);

    console.log("✅ Datasets table created successfully!");

    // Create indexes for better performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "datasets_category_idx" ON "datasets" ("category");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "datasets_is_public_idx" ON "datasets" ("is_public");
    `);

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS "datasets_published_at_idx" ON "datasets" ("published_at" DESC);
    `);

    console.log("✅ Datasets indexes created successfully!");
  } catch (error) {
    console.error("❌ Error creating datasets table:", error);
    throw error;
  }
}

// Run the migration
createDatasetsTable()
  .then(() => {
    console.log("🎉 Datasets migration completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  });
