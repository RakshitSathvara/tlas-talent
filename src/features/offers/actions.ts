"use server";

// Thin server actions (BACKEND-ARCHITECTURE.md §6.3, §8): authorize -> validate -> delegate
// to the service -> revalidate -> return a typed Result. All business logic lives in service.ts.
// (Uses revalidatePath; the doc's tag-based revalidateTag lands when reads adopt `use cache`.)
import { revalidatePath } from "next/cache";
import { requireRole, requireSession } from "@/lib/auth/session";
import { can, hasCapability } from "@/lib/permissions";
import { AppError, toResult } from "@/lib/errors";
import type { Result } from "@/types/result";
import type { OfferStatus } from "@/types/enums";
import type { SessionUser } from "@/types/domain";
import * as service from "./service";
import {
  draftOfferSchema,
  submitForApprovalSchema,
  sendOfferSchema,
  withdrawOfferSchema,
} from "./schema";

export async function draftOffer(
  input: unknown,
): Promise<Result<{ id: string; status: OfferStatus }>> {
  return toResult(async () => {
    const session = await requireRole(can.draftOffer);
    const parsed = draftOfferSchema.parse(input);
    const res = await service.draftOffer(parsed, session);
    revalidatePath("/offers");
    return res;
  });
}

export async function submitForApproval(
  input: unknown,
): Promise<Result<{ id: string; status: OfferStatus }>> {
  return toResult(async () => {
    const session = await requireRole(can.draftOffer);
    const parsed = submitForApprovalSchema.parse(input);
    const res = await service.submitForApproval(parsed, session);
    revalidatePath("/offers");
    revalidatePath(`/offers/${parsed.offerId}`);
    revalidatePath("/approvals");
    return res;
  });
}

// sendOffer is the post-approval dispatch: leadership/admin (approveOffer) may always send,
// and hr/admin (draftOffer) may send too — the service enforces that the offer is 'approved'.
async function requireOfferSender(): Promise<SessionUser> {
  const session = await requireSession();
  if (!hasCapability(session.role, can.approveOffer) && !hasCapability(session.role, can.draftOffer)) {
    throw new AppError("FORBIDDEN", "You don't have permission to do that.");
  }
  return session;
}

export async function sendOffer(
  input: unknown,
): Promise<Result<{ id: string; status: OfferStatus }>> {
  return toResult(async () => {
    const session = await requireOfferSender();
    const parsed = sendOfferSchema.parse(input);
    const res = await service.sendOffer(parsed, session);
    revalidatePath("/offers");
    revalidatePath(`/offers/${parsed.offerId}`);
    return res;
  });
}

export async function withdrawOffer(
  input: unknown,
): Promise<Result<{ id: string; status: OfferStatus }>> {
  return toResult(async () => {
    const session = await requireRole(can.draftOffer);
    const parsed = withdrawOfferSchema.parse(input);
    const res = await service.withdrawOffer(parsed, session);
    revalidatePath("/offers");
    revalidatePath(`/offers/${parsed.offerId}`);
    return res;
  });
}
