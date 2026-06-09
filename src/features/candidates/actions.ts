"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate
// to the service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// advanceStage / rejectCandidate are the shared writes the pipeline board imports too.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import type { StageKey } from "@/types/enums";
import * as service from "./service";
import {
  createCandidateSchema,
  advanceStageSchema,
  rejectCandidateSchema,
  createResumeUploadUrlSchema,
  confirmResumeUploadSchema,
} from "./schema";

export async function createCandidate(
  input: unknown,
): Promise<Result<{ id: string; stage: StageKey }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageCandidates);
    const parsed = createCandidateSchema.parse(input);
    const res = await service.createCandidate(parsed, session);
    revalidatePath("/candidates");
    revalidatePath("/pipeline");
    return res;
  });
}

export async function advanceStage(
  input: unknown,
): Promise<Result<{ id: string; stage: StageKey }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageCandidates);
    const parsed = advanceStageSchema.parse(input);
    const res = await service.advanceStage(parsed, session);
    revalidatePath("/candidates");
    revalidatePath(`/candidates/${parsed.candidateId}`);
    revalidatePath("/pipeline");
    return res;
  });
}

export async function rejectCandidate(
  input: unknown,
): Promise<Result<{ id: string; stage: StageKey }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageCandidates);
    const parsed = rejectCandidateSchema.parse(input);
    const res = await service.rejectCandidate(parsed, session);
    revalidatePath("/candidates");
    revalidatePath(`/candidates/${parsed.candidateId}`);
    revalidatePath("/pipeline");
    return res;
  });
}

/**
 * Step 1 of the resume upload (BACKEND-ARCHITECTURE.md §13.4): mint a presigned PUT URL. The
 * client uploads the bytes straight to Storage with the returned URL, then calls
 * `confirmResumeUpload`. No DB write here, so nothing to revalidate.
 */
export async function createResumeUploadUrl(
  input: unknown,
): Promise<Result<{ uploadUrl: string; token: string; storagePath: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.uploadResume);
    const parsed = createResumeUploadUrlSchema.parse(input);
    return service.createResumeUploadUrl(parsed, session);
  });
}

/** Step 2 of the resume upload: persist the `files` row + audit, then revalidate the detail page. */
export async function confirmResumeUpload(
  input: unknown,
): Promise<Result<{ fileId: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.uploadResume);
    const parsed = confirmResumeUploadSchema.parse(input);
    const res = await service.confirmResumeUpload(parsed, session);
    revalidatePath(`/candidates/${parsed.candidateId}`);
    return res;
  });
}
