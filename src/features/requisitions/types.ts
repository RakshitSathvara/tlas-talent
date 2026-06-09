// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// form, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  createRequisitionSchema,
  editRequisitionSchema,
  updateNotesSchema,
  closeRequisitionSchema,
} from "./schema";

export type CreateRequisitionInput = z.infer<typeof createRequisitionSchema>;
export type EditRequisitionInput = z.infer<typeof editRequisitionSchema>;
export type UpdateNotesInput = z.infer<typeof updateNotesSchema>;
export type CloseRequisitionInput = z.infer<typeof closeRequisitionSchema>;
