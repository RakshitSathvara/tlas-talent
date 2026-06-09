// Zod boundary schemas for interview writes (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the form and the action share these, and the
// action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

export const scheduleInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  requisitionId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime(), // ISO 8601
  round: z.number().int().positive(),
  durationMinutes: z.number().int().positive(),
  mode: z.enum(["video", "in_person"]),
  panelistIds: z.array(z.string().uuid()).min(1),
});

export const rescheduleInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  scheduledAt: z.string().datetime(),
});

export const cancelInterviewSchema = z.object({
  interviewId: z.string().uuid(),
  reason: z.string().optional(),
});
