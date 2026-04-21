// ingest.ts - TypeScript version for better type safety
import "dotenv/config";
import { db } from "./db/index";
import { resources } from "./db/schemas/resources";
import { embeddings as embeddingsTable } from "./db/schemas/embeddings";
import { generateEmbeddings } from "./lib/ai/embeddings";

// Your website data chunks
const websiteData = [
  {
    content:
      "The WatchTower is an intelligent incident reporting platform that enables individuals to securely document events and aggregates these isolated reports into collective community knowledge for protecting rights, igniting inclusion and strengthening civic participation.",
    source: "Homepage",
  },
]

async function ingestData() {
  try {
    console.log("🚀 Starting data ingestion...");
    let totalEmbeddings = 0;

    for (let i = 0; i < websiteData.length; i++) {
      const chunk = websiteData[i];
      console.log(`\n📄 Processing chunk ${i + 1}/${websiteData.length}`);
      console.log(`Content preview: ${chunk.content.substring(0, 80)}...`);

      // Step 1: Insert content into the resources table
      const [newResource] = await db
        .insert(resources)
        .values({ content: chunk.content })
        .returning({ id: resources.id });

      const resourceId = newResource.id;
      console.log(`✅ Created resource with ID: ${resourceId}`);

      // Step 2: Generate embeddings (returns array of {content, embedding} objects)
      const embeddingArray = await generateEmbeddings(chunk.content);
      console.log(`🧠 Generated ${embeddingArray.length} embeddings`);

      // Step 3: Insert each embedding into the embeddings table
      for (const embeddingObj of embeddingArray) {
        await db.insert(embeddingsTable).values({
          resourceId: resourceId,
          content: embeddingObj.content,
          embedding: embeddingObj.embedding,
        });
      }

      totalEmbeddings += embeddingArray.length;
      console.log(
        `✅ Stored ${embeddingArray.length} embeddings for this chunk`
      );
    }

    console.log(`\n🎉 Ingestion complete!`);
    console.log(`📊 Statistics:`);
    console.log(`   - ${websiteData.length} documents processed`);
    console.log(`   - ${totalEmbeddings} total embeddings created`);
    console.log(
      `   - Average ${Math.round(
        totalEmbeddings / websiteData.length
      )} embeddings per document`
    );
  } catch (error) {
    console.error("❌ Error during data ingestion:", error);
    throw error;
  }
}

// Run the ingestion
ingestData()
  .then(() => {
    console.log("✨ Data ingestion completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Data ingestion failed:", error);
    process.exit(1);
  });
