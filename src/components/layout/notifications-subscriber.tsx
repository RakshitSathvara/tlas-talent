"use client";

// Tiny client island that keeps the notification bell live (BACKEND-ARCHITECTURE.md §3.5).
// Subscribes to the signed-in user's own notification rows and refreshes the RSC tree on any
// change, so the unread dot updates without a manual reload. The `recipient_id` filter is
// belt-and-suspenders — RLS (`notifications_select_own`) is the real guard on this user-JWT path.
import { useSessionUser } from "@/components/layout/session-provider";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";

export function NotificationsSubscriber() {
  const user = useSessionUser();
  useRealtimeRefresh({ table: "notifications", filter: `recipient_id=eq.${user.id}` });
  return null;
}
