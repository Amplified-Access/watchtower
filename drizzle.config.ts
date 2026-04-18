import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: ".src/db/drizzle",
  schema: "./src/db/schemas",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
