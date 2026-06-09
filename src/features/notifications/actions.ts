"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate to
// the service -> revalidate -> return a typed Result. Marking read is a per-user gesture, so the
// gate is just requireSession (any authenticated user); the service scopes every write to the
// session recipient's own rows.
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import * as service from "./service";
import {
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
} from "./schema";

export async function markNotificationRead(
  input: unknown,
): Promise<Result<{ id: string; read: true }>> {
  return toResult(async () => {
    const session = await requireSession();
    const parsed = markNotificationReadSchema.parse(input);
    const res = await service.markNotificationRead(parsed, session);
    revalidatePath("/notifications");
    return res;
  });
}

export async function markAllNotificationsRead(
  input: unknown = {},
): Promise<Result<{ ok: true }>> {
  return toResult(async () => {
    const session = await requireSession();
    markAllNotificationsReadSchema.parse(input);
    const res = await service.markAllNotificationsRead(session);
    revalidatePath("/notifications");
    return res;
  });
}
