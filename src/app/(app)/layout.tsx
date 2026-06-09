import { AppShell } from "@/components/layout/app-shell";
import { SessionProvider } from "@/components/layout/session-provider";
import { requireSession } from "@/lib/auth/session";
import { countUnreadNotifications } from "@/features/notifications/queries";

/**
 * The authenticated shell. Enforces a session server-side (redirect to /login when absent)
 * and hands the resolved user to the client tree via SessionProvider so role-aware UI works.
 * The recipient's unread count is fetched here and threaded to the header bell.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSession();
  const unreadCount = await countUnreadNotifications(user.orgId, user.id);
  return (
    <SessionProvider user={user}>
      <AppShell unreadCount={unreadCount}>{children}</AppShell>
    </SessionProvider>
  );
}
