// Zod boundary schemas for approval decisions (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the queue actions and the services share these, and
// each action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

// A decision targets an approval_request by id; the optional note is recorded on the acted step.
export const approvalDecisionSchema = z.object({
  approvalRequestId: z.string().uuid(),
  note: z.string().optional(),
});
