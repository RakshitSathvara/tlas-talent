// Notification writer (BACKEND-ARCHITECTURE.md §6). Drives the in-app bell; Realtime delivers
// the INSERT to the recipient's subscribed client (RLS-scoped by recipient). Written in the
// mutation's transaction so a notification never exists without its triggering change.
import "server-only";
import type { Tx } from "@/lib/db/client";
import { notifications } from "@/lib/db/schema";

type NotificationKind = "approval" | "interview" | "offer" | "candidate" | "system";

export interface NotificationInput {
  orgId: string;
  recipientId: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
}

export async function insertNotification(tx: Tx, input: NotificationInput): Promise<void> {
  await tx.insert(notifications).values({
    orgId: input.orgId,
    recipientId: input.recipientId,
    kind: input.kind,
    title: input.title,
    body: input.body ?? null,
    href: input.href ?? null,
  });
}
