"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate
// to the service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import * as service from "./service";
import {
  scheduleInterviewSchema,
  rescheduleInterviewSchema,
  cancelInterviewSchema,
} from "./schema";

export async function scheduleInterview(
  input: unknown,
): Promise<Result<{ id: string; status: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.scheduleInterview);
    const parsed = scheduleInterviewSchema.parse(input);
    const res = await service.scheduleInterview(parsed, session);
    revalidatePath("/interviews");
    revalidatePath(`/candidates/${parsed.candidateId}`);
    return res;
  });
}

export async function rescheduleInterview(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.scheduleInterview);
    const parsed = rescheduleInterviewSchema.parse(input);
    const res = await service.rescheduleInterview(parsed, session);
    revalidatePath("/interviews");
    revalidatePath(`/interviews/${parsed.interviewId}`);
    return res;
  });
}

export async function cancelInterview(
  input: unknown,
): Promise<Result<{ id: string; status: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.scheduleInterview);
    const parsed = cancelInterviewSchema.parse(input);
    const res = await service.cancelInterview(parsed, session);
    revalidatePath("/interviews");
    revalidatePath(`/interviews/${parsed.interviewId}`);
    return res;
  });
}
