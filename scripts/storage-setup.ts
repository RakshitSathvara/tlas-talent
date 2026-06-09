// Creates the private Storage buckets the app needs (BACKEND-ARCHITECTURE.md §13.4 Files):
// `resumes` (candidate résumés) and `offers` (offer PDFs). Both are PRIVATE — bytes are only
// ever served via the access-checked `/api/files/[id]` route, which redirects to a short-lived
// signed URL. Idempotent: re-running ignores buckets that already exist.
//
// Run with `npm run db:storage` (after the DB is set up). Uses process.env directly (dotenv)
// like scripts/seed.ts — no @/ aliases, so it runs under tsx without path config.
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (/YOUR[-_](REGION|DB_PASSWORD|PROJECT-REF|ANON_PUBLIC_KEY|SERVICE_ROLE_KEY)/.test(`${SUPABASE_URL}${SERVICE_ROLE}`)) {
  console.error(".env.local still has placeholders — paste your real Supabase values (Settings → API for the keys).");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKETS = ["resumes", "offers"] as const;

async function main() {
  for (const name of BUCKETS) {
    const { error } = await admin.storage.createBucket(name, { public: false });
    if (error) {
      // Idempotent: a bucket that already exists is not a failure.
      if (/already exists|exists/i.test(error.message)) {
        console.log(`• bucket '${name}' already exists — skipping`);
        continue;
      }
      throw error;
    }
    console.log(`✓ created private bucket '${name}'`);
  }
  console.log("\nStorage setup complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
