import {
  pgTable,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";

export const datasets = pgTable("datasets", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  category: varchar("category", { length: 100 }).notNull(), // e.g., "Conflict", "Demographics", "Economic", "Health"
  tags: text("tags").array(), // Array of tags for better categorization
  fileKey: varchar("file_key", { length: 255 }).notNull(), // CloudFlare R2 key
  fileName: varchar("file_name", { length: 255 }).notNull(), // Original filename
  fileSize: integer("file_size").notNull(), // File size in bytes
  fileType: varchar("file_type", { length: 100 }).notNull(), // MIME type
  downloadCount: integer("download_count").default(0),
  isPublic: boolean("is_public").default(true),
  publishedAt: timestamp("published_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  // Metadata fields
  source: varchar("source", { length: 255 }), // Data source/provider
  license: varchar("license", { length: 100 }).default("CC BY 4.0"), // Data license
  version: varchar("version", { length: 20 }).default("1.0"),
  coverage: varchar("coverage", { length: 255 }), // Geographic or temporal coverage
  format: varchar("format", { length: 50 }).notNull(), // CSV, JSON, Excel, etc.
  // SEO and discovery
  keywords: text("keywords").array(), // Additional keywords for search
  methodology: text("methodology"), // How the data was collected
});
