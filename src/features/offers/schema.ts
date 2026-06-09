// Zod boundary schemas for offer writes (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the form and the action share these, and the
// action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

// `ctc` is canonical INR rupees (e.g. 2_850_000 -> '₹28.5L' for display); `joiningDate` is a
// 'YYYY-MM-DD' calendar date.
export const offerTermsSchema = z.object({
  band: z.string().min(1),
  ctc: z.number().positive(),
  location: z.string().min(1),
  joiningDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD"),
  type: z.string().min(1),
});

export const draftOfferSchema = z.object({
  candidateId: z.string().uuid(),
  requisitionId: z.string().uuid().optional(),
  terms: offerTermsSchema,
});

export const submitForApprovalSchema = z.object({
  offerId: z.string().uuid(),
});

export const sendOfferSchema = z.object({
  offerId: z.string().uuid(),
});

export const withdrawOfferSchema = z.object({
  offerId: z.string().uuid(),
  reason: z.string().optional(),
});
