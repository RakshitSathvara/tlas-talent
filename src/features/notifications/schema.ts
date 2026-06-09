// Zod boundary schemas for notification writes (BACKEND-ARCHITECTURE.md §8). The single source
// of truth for anything crossing client↔server — the bell controls and the actions share these,
// and the action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

export const markNotificationReadSchema = z.object({
  id: z.string().uuid(),
});

// markAllNotificationsRead takes no caller input — it always scopes to the session recipient —
// but we keep an empty schema for a uniform authorize -> validate -> delegate action shape.
export const markAllNotificationsReadSchema = z.object({});
