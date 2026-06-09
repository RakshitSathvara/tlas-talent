"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate
// to the service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { AppError, toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import type { SessionUser } from "@/types/domain";
import * as service from "./service";
import {
  createRequisitionSchema,
  editRequisitionSchema,
  updateNotesSchema,
  closeRequisitionSchema,
} from "./schema";

export async function createRequisition(
  input: unknown,
): Promise<Result<{ id: string; status: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.createRequisition);
    const parsed = createRequisitionSchema.parse(input);
    const res = await service.createRequisition(parsed, session);
    revalidatePath("/requisitions");
    revalidatePath("/approvals");
    return res;
  });
}

export async function editRequisition(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.createRequisition);
    const parsed = editRequisitionSchema.parse(input);
    const res = await service.editRequisition(parsed, session);
    revalidatePath("/requisitions");
    revalidatePath(`/requisitions/${parsed.id}`);
    return res;
  });
}

// updateRequisitionNotes / closeRequisition are operational writes: hr, leadership, admin
// (route-gated; no single capability). Interviewers are refused.
async function requireRequisitionWriter(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role === "interviewer") {
    throw new AppError("FORBIDDEN", "You don't have permission to do that.");
  }
  return session;
}

export async function updateRequisitionNotes(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRequisitionWriter();
    const parsed = updateNotesSchema.parse(input);
    const res = await service.updateRequisitionNotes(parsed, session);
    revalidatePath(`/requisitions/${parsed.id}`);
    return res;
  });
}

export async function closeRequisition(
  input: unknown,
): Promise<Result<{ id: string; status: string }>> {
  return toResult(async () => {
    const session = await requireRequisitionWriter();
    const parsed = closeRequisitionSchema.parse(input);
    const res = await service.closeRequisition(parsed, session);
    revalidatePath("/requisitions");
    revalidatePath(`/requisitions/${parsed.id}`);
    return res;
  });
}
