# 📚 Data Ingestion Guide for WatchTower RAG System

## Overview

This guide explains various methods to add your site's data to the RAG (Retrieval Augmented Generation) database. The system uses Google Gemini for embeddings and supports multiple ingestion strategies.

## 🎯 Methods to Add Data

### 1. **Bulk Website Content Ingestion** (Current approach)

**Use Case:** Add all your website content at once
**File:** `src/ingest.ts`

```bash
# Run the ingestion script
cd apps/watchtower
npx tsx src/ingest.ts
```

**What it does:**

- Processes predefined chunks of your website content
- Generates embeddings for each sentence
- Stores both original content and embeddings
- Perfect for initial data seeding

### 2. **Manual Chat Interface** (Already working)

**Use Case:** Add knowledge through conversation
**URL:** `/chat`

**How to use:**

- Visit http://localhost:3000/chat
- Say: "Our platform supports incident reporting in East Africa"
- The AI automatically stores this as knowledge
- Perfect for adding specific facts or updates

### 3. **API-Based Ingestion** (Create custom endpoint)

**Use Case:** Programmatic data addition from external sources

Create `src/app/api/ingest/route.ts`:

```typescript
import { createResource } from "@/lib/actions/resources";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return Response.json({ error: "Content is required" }, { status: 400 });
    }

    const result = await createResource({ content });
    return Response.json({ message: result });
  } catch (error) {
    return Response.json({ error: "Failed to add content" }, { status: 500 });
  }
}
```

**Usage:**

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"content": "New information about our platform"}'
```

### 4. **File Upload Ingestion** (For documents)

**Use Case:** Upload PDFs, text files, or other documents

Create `src/lib/utils/file-ingestion.ts`:

```typescript
import { createResource } from "@/lib/actions/resources";
import pdf from "pdf-parse";

export async function ingestPDF(buffer: Buffer) {
  try {
    const data = await pdf(buffer);
    const text = data.text;

    // Split into smaller chunks (e.g., by paragraphs)
    const chunks = text
      .split("\n\n")
      .filter((chunk) => chunk.trim().length > 50);

    for (const chunk of chunks) {
      await createResource({ content: chunk.trim() });
    }

    return { success: true, chunksProcessed: chunks.length };
  } catch (error) {
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}
```

### 5. **Database Migration Ingestion** (For existing data)

**Use Case:** Import data from existing databases

Create `src/scripts/migrate-existing-data.ts`:

```typescript
import { db } from "@/db";
import { createResource } from "@/lib/actions/resources";
import { insights, reports } from "@/db/schemas";

export async function migrateExistingData() {
  // Example: Migrate insights to RAG system
  const existingInsights = await db.select().from(insights);

  for (const insight of existingInsights) {
    const content = `${insight.title}. ${insight.description}. ${JSON.stringify(
      insight.content
    )}`;
    await createResource({ content });
  }

  // Example: Migrate reports
  const existingReports = await db.select().from(reports);

  for (const report of existingReports) {
    const content = `Report: ${report.title}. This report was published by organization ${report.organizationId}.`;
    await createResource({ content });
  }
}
```

## 🔧 Advanced Data Processing

### Chunk Size Optimization

Current chunking splits by sentences (periods). You can customize this:

```typescript
// In src/lib/ai/embeddings.ts
const generateChunks = (input: string): string[] => {
  // Option 1: Split by sentences (current)
  return input
    .trim()
    .split(".")
    .filter((i) => i !== "");

  // Option 2: Split by paragraphs
  // return input.trim().split('\n\n').filter(i => i !== '');

  // Option 3: Fixed-size chunks (e.g., 500 characters)
  // const chunks = [];
  // for (let i = 0; i < input.length; i += 500) {
  //   chunks.push(input.slice(i, i + 500));
  // }
  // return chunks.filter(chunk => chunk.trim().length > 0);
};
```

### Content Preprocessing

Add content cleaning before embedding:

```typescript
function preprocessContent(content: string): string {
  return content
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/[^\w\s.,!?-]/g, "") // Remove special chars
    .trim();
}
```

## 📊 Monitoring and Management

### Check Data Status

```typescript
// Check how much data you have
const resourceCount = await db.select({ count: sql`count(*)` }).from(resources);
const embeddingCount = await db
  .select({ count: sql`count(*)` })
  .from(embeddings);

console.log(`Resources: ${resourceCount[0].count}`);
console.log(`Embeddings: ${embeddingCount[0].count}`);
```

### Clear All Data (if needed)

```typescript
// Clear all RAG data (use with caution!)
await db.delete(embeddings);
await db.delete(resources);
```

## 🚀 Recommended Ingestion Strategy

1. **Start with bulk ingestion** - Run `ingest.ts` to add your core website content
2. **Use chat interface** - Add specific knowledge through conversation
3. **Set up API endpoint** - For ongoing programmatic updates
4. **Monitor performance** - Check search quality and add more specific content as needed

## 🎛️ Configuration Options

### Environment Variables

- `GOOGLE_GENERATIVE_AI_API_KEY` - For embeddings and chat
- `DATABASE_URL` - PostgreSQL with pgvector extension

### Similarity Threshold

Adjust in `src/lib/ai/embeddings.ts`:

```typescript
.where(gt(similarity, 0.5)) // Lower = more results, higher = more precise
```

### Embedding Dimensions

Currently using 768 (Google text-embedding-004). If you change models, update the schema:

```typescript
// In src/db/schemas/embeddings.ts
embedding: vector("embedding", { dimensions: 768 }); // Update if needed
```

---

**Next Steps:**

1. Run the bulk ingestion: `npx tsx src/ingest.ts`
2. Test the chat interface at `/chat`
3. Monitor performance and add more specific content as needed
