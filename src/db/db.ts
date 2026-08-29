import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const client = postgres(process.env.DATABASE_URL!, {
  ssl: process.env.NODE_ENV === "production" ? "require" : false,
  // Required for Supabase transaction pooler (port 6543) on serverless.
  prepare: false,
  max: 1,
});

export const db = drizzle(client, { schema });
