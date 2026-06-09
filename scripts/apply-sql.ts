// Applies the non-Drizzle SQL migrations (supabase/migrations/*.sql) in order, using the
// `postgres` driver over DIRECT_URL — no psql or Supabase CLI required. Run after db:migrate.
import { config } from "dotenv";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

config({ path: ".env.local" });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DIRECT_URL or DATABASE_URL must be set in .env.local");
  process.exit(1);
}
if (/YOUR[-_](REGION|DB_PASSWORD|PROJECT-REF)/.test(url)) {
  console.error(
    "DATABASE_URL/DIRECT_URL still has placeholders (YOUR-REGION / YOUR_DB_PASSWORD). Copy the full connection string from Supabase → Connect → Connection pooling.",
  );
  process.exit(1);
}

async function main(): Promise<void> {
  const sql = postgres(url as string, { max: 1 });
  const dir = join(process.cwd(), "supabase", "migrations");
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  // All files in ONE transaction: a failure rolls everything back, so the DB is never left in a
  // partially-applied state (e.g. RLS enabled without the hook). Migrations are idempotent, so
  // re-running after a fix is safe.
  await sql.begin(async (tx) => {
    for (const file of files) {
      process.stdout.write(`applying ${file} ... `);
      await tx.unsafe(readFileSync(join(dir, file), "utf8"));
      console.log("ok");
    }
  });

  await sql.end();
  console.log(`\nApplied ${files.length} SQL migration(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
