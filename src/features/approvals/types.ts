// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// queue actions and the services can never drift from the validation.
import type { z } from "zod";
import type { approvalDecisionSchema } from "./schema";

export type ApprovalDecisionInput = z.infer<typeof approvalDecisionSchema>;
