// The Drizzle instance over the pooled `postgres` driver (BACKEND-ARCHITECTURE.md §4.1).
// Connects with a privileged role and BYPASSES RLS — so every read/write MUST be explicitly
// org-scoped in the query/service layer (§3.4). A global singleton avoids exhausting the
// pooler across Next dev hot-reloads.
import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "@/lib/db/schema";

const globalForDb = globalThis as unknown as { _pg?: ReturnType<typeof postgres> };

// `prepare: false` is required for Supabase's transaction-mode pooler (port 6543).
const client = globalForDb._pg ?? postgres(env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== "production") globalForDb._pg = client;

export const db = drizzle(client, { schema });

export type DB = typeof db;
/** The transaction handle type, so repository helpers can run inside a `db.transaction`. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
