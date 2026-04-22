import { customType, pgTable, text } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";
import { resources } from "./resources";

const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
});

export const embeddings = pgTable("embedding", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  resourceId: text("resource_id").references(() => resources.id, {
    onDelete: "cascade",
  }),
  content: text("content").notNull(),
  embedding: vector("embedding").notNull(),
});
