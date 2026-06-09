// Zod boundary schemas for candidate writes (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the form and the action share these, and the
// action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

export const createCandidateSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  requisitionId: z.string().uuid().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  experience: z.string().optional(),
  location: z.string().optional(),
  source: z.string().optional(),
  expectedCtcDisplay: z.string().optional(),
  noticePeriod: z.string().optional(),
  summary: z.string().optional(),
});

// Advancing never targets the entry stage ('sourced') or 'rejected' (use rejectCandidate).
export const advanceStageSchema = z.object({
  candidateId: z.string().uuid(),
  toStage: z.enum(["hr_review", "tl_review", "interview", "offer", "hired"]),
  note: z.string().optional(),
});

export const rejectCandidateSchema = z.object({
  candidateId: z.string().uuid(),
  reason: z.string().min(1),
});

// Resume upload (BACKEND-ARCHITECTURE.md §13.4 Files). Private bucket 'resumes'; the upload
// itself goes straight to Storage via a presigned PUT, so only metadata crosses this boundary.
// The allowed content types are PDF / DOC / DOCX; the size cap is the doc's 10MB ceiling.
export const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10MB

export const resumeContentType = z.enum([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

// Step 1: mint a presigned upload URL (no DB write).
export const createResumeUploadUrlSchema = z.object({
  candidateId: z.string().uuid(),
  fileName: z.string().trim().min(1),
  contentType: resumeContentType,
  sizeBytes: z.number().int().positive().max(MAX_RESUME_BYTES),
});

// Step 2: after the client PUTs the bytes, persist the `files` row. `storagePath` is the path
// returned by step 1 — re-validated server-side against the candidate's org namespace.
export const confirmResumeUploadSchema = z.object({
  candidateId: z.string().uuid(),
  storagePath: z.string().min(1),
  contentType: resumeContentType,
  sizeBytes: z.number().int().positive().max(MAX_RESUME_BYTES),
});
