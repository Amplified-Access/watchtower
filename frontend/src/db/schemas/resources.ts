import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { nanoid } from "nanoid";
import { z } from "zod";

export const resources = pgTable("resource", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  content: text("content").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  content: true,
});

export type NewResourceParams = z.infer<typeof insertResourceSchema>;
