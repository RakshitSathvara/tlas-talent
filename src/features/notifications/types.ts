// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// bell controls, the actions, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  markNotificationReadSchema,
  markAllNotificationsReadSchema,
} from "./schema";

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;
export type MarkAllNotificationsReadInput = z.infer<typeof markAllNotificationsReadSchema>;
