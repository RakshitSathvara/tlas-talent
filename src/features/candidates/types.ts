// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// form, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  createCandidateSchema,
  advanceStageSchema,
  rejectCandidateSchema,
  createResumeUploadUrlSchema,
  confirmResumeUploadSchema,
} from "./schema";

export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type AdvanceStageInput = z.infer<typeof advanceStageSchema>;
export type RejectCandidateInput = z.infer<typeof rejectCandidateSchema>;
export type CreateResumeUploadUrlInput = z.infer<typeof createResumeUploadUrlSchema>;
export type ConfirmResumeUploadInput = z.infer<typeof confirmResumeUploadSchema>;

/** The latest resume file row for a candidate, surfaced to the detail page for a download link. */
export interface ResumeFile {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  uploadedOn: string;
}
