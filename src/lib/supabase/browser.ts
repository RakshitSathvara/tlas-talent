// Browser Supabase client for Client Components (BACKEND-ARCHITECTURE.md §3.5). Used ONLY
// for Realtime subscriptions (and must call `supabase.realtime.setAuth(accessToken)` so the
// user JWT — incl. the role claim — flows to Realtime and RLS scopes rows). Reads the public
// env vars from process.env (Next inlines NEXT_PUBLIC_* at build); never imports lib/env.
"use client";
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
