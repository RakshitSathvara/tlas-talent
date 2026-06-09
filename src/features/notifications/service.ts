// server-only: notification business rules (BACKEND-ARCHITECTURE.md §8). Marking read is a
// routine per-user gesture on the bell — strictly recipient-scoped (a user can only ever touch
// their OWN rows) — so it isn't an audit/activity-worthy business change; each write still runs
// in a transaction. Notification *creation* lives in the triggering mutation's transaction via
// the notifications repo, not here.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";
import type { MarkNotificationReadInput } from "./types";

/** Mark one of the recipient's own notifications read. Scoped to the session user's rows. */
export async function markNotificationRead(
  input: MarkNotificationReadInput,
  session: SessionUser,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({ id: notifications.id })
      .from(notifications)
      .where(
        and(
          eq(notifications.id, input.id),
          eq(notifications.orgId, session.orgId),
          eq(notifications.recipientId, session.id),
        ),
      )
      .limit(1);
    if (!row) throw new AppError("NOT_FOUND", "Notification not found.");

    await tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, input.id),
          eq(notifications.orgId, session.orgId),
          eq(notifications.recipientId, session.id),
        ),
      );

    return { id: row.id, read: true as const };
  });
}

/** Mark every one of the recipient's own unread notifications read. */
export async function markAllNotificationsRead(session: SessionUser) {
  return db.transaction(async (tx) => {
    await tx
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.orgId, session.orgId),
          eq(notifications.recipientId, session.id),
          eq(notifications.isRead, false),
        ),
      );

    return { ok: true as const };
  });
}
