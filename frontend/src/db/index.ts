import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as authSchema from "./schemas/auth";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema: authSchema });
