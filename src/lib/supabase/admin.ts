// Service-role Supabase client (BACKEND-ARCHITECTURE.md §4.1). Server-only; bypasses RLS.
// Used strictly for privileged Storage operations (signed upload/download URLs for the
// private `resumes` / `offers` buckets) and admin auth tasks. NEVER imported by client code.
import "server-only";
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
