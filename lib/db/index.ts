import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Reuse the pool across hot-reloads in dev to avoid exhausting connections.
// connectionString may be undefined at build time; pg only connects on the
// first query, so we don't throw here (that would break `next build`).
const globalForDb = globalThis as unknown as { pool?: Pool };
const pool =
  globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL });
if (process.env.NODE_ENV !== "production") globalForDb.pool = pool;

export const db = drizzle(pool, { schema });
