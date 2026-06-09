"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate
// to the service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import type { Role } from "@/types/enums";
import * as service from "./service";
import {
  updateProfileSchema,
  inviteUserSchema,
  changeRoleSchema,
  deactivateUserSchema,
  updateStageConfigSchema,
  updateApprovalChainSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
} from "./schema";

/* ── Profile (self-service) ── */
export async function updateProfile(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireSession();
    const parsed = updateProfileSchema.parse(input);
    const res = await service.updateProfile(parsed, session);
    revalidatePath("/settings");
    return res;
  });
}

/* ── Users (admin) ── */
export async function inviteUser(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageUsers);
    const parsed = inviteUserSchema.parse(input);
    const res = await service.inviteUser(parsed, session);
    revalidatePath("/settings/team");
    return res;
  });
}

export async function changeRole(
  input: unknown,
): Promise<Result<{ id: string; role: Role }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageUsers);
    const parsed = changeRoleSchema.parse(input);
    const res = await service.changeRole(parsed, session);
    revalidatePath("/settings/team");
    return res;
  });
}

export async function deactivateUser(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageUsers);
    const parsed = deactivateUserSchema.parse(input);
    const res = await service.deactivateUser(parsed, session);
    revalidatePath("/settings/team");
    return res;
  });
}

/* ── Pipeline config (admin) ── */
export async function updateStageConfig(input: unknown): Promise<Result<{ stage: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageUsers);
    const parsed = updateStageConfigSchema.parse(input);
    const res = await service.updateStageConfig(parsed, session);
    revalidatePath("/settings/pipeline-config");
    return res;
  });
}

export async function updateApprovalChain(
  input: unknown,
): Promise<Result<{ id: string; band: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageUsers);
    const parsed = updateApprovalChainSchema.parse(input);
    const res = await service.updateApprovalChain(parsed, session);
    revalidatePath("/settings/pipeline-config");
    return res;
  });
}

/* ── Templates (manageTemplates) ── */
export async function createTemplate(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageTemplates);
    const parsed = createTemplateSchema.parse(input);
    const res = await service.createTemplate(parsed, session);
    revalidatePath("/settings/templates");
    return res;
  });
}

export async function updateTemplate(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageTemplates);
    const parsed = updateTemplateSchema.parse(input);
    const res = await service.updateTemplate(parsed, session);
    revalidatePath("/settings/templates");
    return res;
  });
}

export async function deleteTemplate(input: unknown): Promise<Result<{ id: string }>> {
  return toResult(async () => {
    const session = await requireRole(can.manageTemplates);
    const parsed = deleteTemplateSchema.parse(input);
    const res = await service.deleteTemplate(parsed, session);
    revalidatePath("/settings/templates");
    return res;
  });
}
