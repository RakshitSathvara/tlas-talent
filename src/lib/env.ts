// Validated, frozen environment (BACKEND-ARCHITECTURE.md §4.3). Read once at boot; importing
// `env` with a missing/malformed var crashes the process immediately, never at first request.
//
// NOTE: vars needed only by later milestones (Offers email, Interviews calendar, the JWT
// hook secret) are optional for now so the app boots with just Supabase + DB credentials.
// Make them required as those features land. Node scripts (drizzle.config, seed) read
// process.env directly instead of importing this module.
import { z } from "zod";

const server = z.object({
  DATABASE_URL: z.string().url(), // pooled (connection pooler) — Drizzle runtime
  DIRECT_URL: z.string().url().optional(), // direct 5432 — migrations only (scripts read it directly)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1), // Storage signed URLs + admin (server-only)
  APP_URL: z.string().url().default("http://localhost:3000"),

  // Later-milestone integrations — optional until wired (Offers / Interviews / prod JWT hook).
  SUPABASE_JWT_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  CALENDAR_CLIENT_ID: z.string().min(1).optional(),
  CALENDAR_CLIENT_SECRET: z.string().min(1).optional(),
});

const client = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = server.merge(client).safeParse(process.env);
if (!parsed.success) {
  console.error("Invalid environment:", parsed.error.flatten().fieldErrors);
  throw new Error("Environment validation failed — see logs above.");
}

// Fail fast on leftover .env.local placeholders, so a missing real value surfaces as a clear
// message at boot rather than a cryptic ENOTFOUND deep inside a request.
const PLACEHOLDER = /YOUR[-_](ANON_PUBLIC_KEY|SERVICE_ROLE_KEY|DB_PASSWORD|REGION|JWT_SECRET|PROJECT-REF)/;
const unfilled = Object.entries(parsed.data)
  .filter(([, v]) => typeof v === "string" && PLACEHOLDER.test(v))
  .map(([k]) => k);
if (unfilled.length > 0) {
  throw new Error(
    `These env vars still contain .env.local placeholders — paste your real Supabase values and restart: ${unfilled.join(", ")}`,
  );
}

export const env = Object.freeze(parsed.data);
