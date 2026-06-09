// Zod boundary schemas for feedback writes (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the feedback modal and the action share these,
// and the action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

const ratingScore = z.number().int().min(1).max(5);

export const submitFeedbackSchema = z.object({
  interviewId: z.string().uuid(),
  round: z.number().int().positive(),
  ratings: z.object({
    technical: ratingScore,
    communication: ratingScore,
    roleFit: ratingScore,
    cultural: ratingScore,
  }),
  recommendation: z.enum(["strong_yes", "yes", "maybe", "no"]),
  notes: z.string().optional(),
});
