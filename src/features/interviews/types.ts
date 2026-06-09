// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// form, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  scheduleInterviewSchema,
  rescheduleInterviewSchema,
  cancelInterviewSchema,
} from "./schema";

export type ScheduleInterviewInput = z.infer<typeof scheduleInterviewSchema>;
export type RescheduleInterviewInput = z.infer<typeof rescheduleInterviewSchema>;
export type CancelInterviewInput = z.infer<typeof cancelInterviewSchema>;
