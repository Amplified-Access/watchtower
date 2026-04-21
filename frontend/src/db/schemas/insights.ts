import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { organizations } from "./organizations";

export const insightTags = pgTable("insight_tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insights = pgTable("insights", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Content fields
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  content: jsonb("content"), // Store rich content as JSON

  // Meta fields
  authorId: text("author_id")
    .references(() => user.id)
    .notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),

  // Image/media
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),

  // Status and publication
  status: text("status").notNull().default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Junction table for many-to-many relationship between insights and tags
export const insightTagRelations = pgTable("insight_tag_relations", {
  id: uuid("id").defaultRandom().primaryKey(),
  insightId: uuid("insight_id")
    .references(() => insights.id)
    .notNull(),
  tagId: uuid("tag_id")
    .references(() => insightTags.id)
    .notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
