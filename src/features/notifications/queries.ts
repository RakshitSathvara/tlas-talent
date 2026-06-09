// server-only: Drizzle reads for the notifications bell + page (BACKEND-ARCHITECTURE.md §7.1).
// Recipient-scoped AND org-scoped (Drizzle bypasses RLS): a user only ever sees their own rows.
// `when` is the compact relative time off created_at; `read` mirrors the is_read column.
import "server-only";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { relativeTime } from "@/lib/format";
import type { AppNotification } from "@/types/domain";

/** Every notification for the recipient (org-scoped), newest first, in the bell's domain shape. */
export async function listNotifications(
  orgId: string,
  recipientId: string,
): Promise<AppNotification[]> {
  const rows = await db
    .select({
      id: notifications.id,
      kind: notifications.kind,
      title: notifications.title,
      body: notifications.body,
      href: notifications.href,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(
      and(eq(notifications.orgId, orgId), eq(notifications.recipientId, recipientId)),
    )
    .orderBy(desc(notifications.createdAt));

  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body ?? "",
    when: relativeTime(r.createdAt),
    read: r.isRead,
    href: r.href ?? "#",
  }));
}

/** The recipient's unread count (org-scoped) — drives the header bell dot. */
export async function countUnreadNotifications(
  orgId: string,
  recipientId: string,
): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.orgId, orgId),
        eq(notifications.recipientId, recipientId),
        eq(notifications.isRead, false),
      ),
    );
  return row?.value ?? 0;
}
