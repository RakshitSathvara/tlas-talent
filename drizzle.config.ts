// Drizzle Kit config (BACKEND-ARCHITECTURE.md §4.4). `src/lib/db/schema.ts` is the source of
// truth; `npm run db:generate` diffs it into ./drizzle. Migrations connect via DIRECT_URL.
import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";
if (!url || /YOUR[-_](REGION|DB_PASSWORD|PROJECT-REF)/.test(url)) {
  throw new Error(
    "DIRECT_URL/DATABASE_URL in .env.local is missing or still has placeholders (YOUR-REGION / YOUR_DB_PASSWORD). Copy the full connection string from Supabase → Connect → Connection pooling.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
  casing: "snake_case",
  verbose: true,
  strict: true,
});
