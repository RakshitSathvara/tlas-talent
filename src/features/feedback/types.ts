// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// feedback modal, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type { submitFeedbackSchema } from "./schema";

export type SubmitFeedbackInput = z.infer<typeof submitFeedbackSchema>;
