// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// form, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  draftOfferSchema,
  submitForApprovalSchema,
  sendOfferSchema,
  withdrawOfferSchema,
} from "./schema";

export type DraftOfferInput = z.infer<typeof draftOfferSchema>;
export type SubmitForApprovalInput = z.infer<typeof submitForApprovalSchema>;
export type SendOfferInput = z.infer<typeof sendOfferSchema>;
export type WithdrawOfferInput = z.infer<typeof withdrawOfferSchema>;
