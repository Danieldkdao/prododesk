import { envServer } from "@/data/env/server";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const pool = new Pool({
  connectionString: envServer.DATABASE_URL,
});

export const db = drizzle({
  client: pool,
  schema,
});

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
