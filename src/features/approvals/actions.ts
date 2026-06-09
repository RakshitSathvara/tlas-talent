"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate to the
// service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import * as service from "./service";
import { approvalDecisionSchema } from "./schema";

export async function approveRequisition(
  input: unknown,
): Promise<Result<{ id: string; state: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.approveRequisition);
    const parsed = approvalDecisionSchema.parse(input);
    const res = await service.approveRequisition(parsed, session);
    revalidatePath("/approvals");
    revalidatePath("/requisitions");
    return res;
  });
}

export async function rejectRequisition(
  input: unknown,
): Promise<Result<{ id: string; state: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.approveRequisition);
    const parsed = approvalDecisionSchema.parse(input);
    const res = await service.rejectRequisition(parsed, session);
    revalidatePath("/approvals");
    revalidatePath("/requisitions");
    return res;
  });
}

export async function approveOffer(
  input: unknown,
): Promise<Result<{ id: string; state: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.approveOffer);
    const parsed = approvalDecisionSchema.parse(input);
    const res = await service.approveOffer(parsed, session);
    revalidatePath("/approvals");
    revalidatePath("/offers");
    return res;
  });
}

export async function rejectOffer(input: unknown): Promise<Result<{ id: string; state: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.approveOffer);
    const parsed = approvalDecisionSchema.parse(input);
    const res = await service.rejectOffer(parsed, session);
    revalidatePath("/approvals");
    revalidatePath("/offers");
    return res;
  });
}
