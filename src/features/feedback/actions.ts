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
import { submitFeedbackSchema } from "./schema";

export async function submitFeedback(
  input: unknown,
): Promise<Result<{ id: string; candidateId: string; interviewStatus: "pending_feedback" | "completed" }>> {
  return toResult(async () => {
    const session = await requireRole(can.submitFeedback);
    const parsed = submitFeedbackSchema.parse(input);
    const res = await service.submitFeedback(parsed, session);
    revalidatePath("/interviews");
    revalidatePath(`/interviews/${parsed.interviewId}`);
    revalidatePath(`/candidates/${res.candidateId}`);
    return res;
  });
}
