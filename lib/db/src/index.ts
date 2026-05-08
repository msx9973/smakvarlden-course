import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export const pool = hasDatabase
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const missingDatabaseError = () =>
  new Error("DATABASE_URL must be set. Running with demo API fallbacks.");

export const db = hasDatabase && pool
  ? drizzle(pool, { schema })
  : new Proxy({}, {
      get() {
        throw missingDatabaseError();
      },
    }) as ReturnType<typeof drizzle<typeof schema>>;

export * from "./schema";
