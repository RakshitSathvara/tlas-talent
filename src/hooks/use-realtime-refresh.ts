"use client";

// Live-widget refresh via Supabase Realtime (BACKEND-ARCHITECTURE.md §3.5). The RSC-refresh
// approach: subscribe to `postgres_changes` on a live table and call `router.refresh()` on any
// event, which re-pulls the authoritative server data (Realtime is read-only and additive — it
// only nudges the UI; the RSC render stays the source of truth).
//
// We MUST send the user's access token via `supabase.realtime.setAuth(...)` so the same JWT —
// incl. the `role`/`org_id` claims — flows to Realtime and RLS scopes which rows we receive. This
// is the only path that reaches Postgres with the user JWT, so RLS is the sole guard; the optional
// `filter` is belt-and-suspenders, not the real fence.
//
// FALLBACK: if Realtime isn't enabled on the project (table not in the publication, or websocket
// unavailable), the channel simply never fires — the RSC data is still correct on navigation.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function useRealtimeRefresh({ table, filter }: { table: string; filter?: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | undefined;
    let cancelled = false;

    async function subscribe() {
      // Guard against a missing session — without a token Realtime would leak across orgs/users.
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;

      // REQUIRED: send the user JWT so RLS scopes streamed rows to this user/org.
      supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`realtime-refresh:${table}${filter ? `:${filter}` : ""}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
          () => router.refresh(),
        )
        .subscribe();
    }

    void subscribe();

    return () => {
      cancelled = true;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [table, filter, router]);
}
