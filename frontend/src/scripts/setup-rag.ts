import "dotenv/config";
import { db } from "@/db";
import { sql } from "drizzle-orm";

async function setupPgVector() {
  console.log("🔧 Setting up pgvector extension...");

  try {
    // Enable pgvector extension
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector;`);
    console.log("✅ pgvector extension enabled successfully!");

    console.log("🎉 RAG setup completed successfully!");
  } catch (error) {
    console.error("❌ Error setting up pgvector:", error);
    throw error;
  }
}

// Run the setup
setupPgVector()
  .then(() => {
    console.log("🎉 RAG database setup completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 RAG setup failed:", error);
    process.exit(1);
  });
