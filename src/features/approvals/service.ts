// server-only: the only place approval-decision business rules live (BACKEND-ARCHITECTURE.md §8).
// Each decision runs in a transaction: it advances the lowest-order pending step, recomputes the
// request state from all steps, applies the entity side-effect (requisition/offer status), and
// writes its audit + activity + a notification to the requester — so everything commits atomically.
import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  approvalRequests,
  approvalSteps,
  offers,
  requisitions,
} from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { insertNotification } from "@/lib/db/repositories/notifications";
import { AppError } from "@/lib/errors";
import type { Tx } from "@/lib/db/client";
import type { ApprovalType } from "@/types/enums";
import type { SessionUser } from "@/types/domain";
import type { ApprovalDecisionInput } from "./types";

type Decision = "approved" | "rejected";

/**
 * Apply a decision to the lowest-order pending step of an org-scoped, still-pending approval
 * request of the expected `type`, then recompute the request state. Returns the request row +
 * its newly recomputed state so callers can run the right entity side-effect. The transaction
 * (audit/activity/notification + entity status) is owned by the caller.
 */
async function decide(
  tx: Tx,
  input: ApprovalDecisionInput,
  expectedType: ApprovalType,
  decision: Decision,
  session: SessionUser,
) {
  const [request] = await tx
    .select()
    .from(approvalRequests)
    .where(
      and(
        eq(approvalRequests.id, input.approvalRequestId),
        eq(approvalRequests.orgId, session.orgId),
        eq(approvalRequests.type, expectedType),
      ),
    )
    .limit(1);
  if (!request) throw new AppError("NOT_FOUND", "Approval request not found.");
  if (request.state !== "pending") {
    throw new AppError("APPROVAL_STATE", "This request has already been decided.");
  }

  // The lowest-order step still awaiting a decision is the one this approver acts on.
  const [step] = await tx
    .select()
    .from(approvalSteps)
    .where(
      and(
        eq(approvalSteps.approvalRequestId, request.id),
        eq(approvalSteps.orgId, session.orgId),
        eq(approvalSteps.state, "pending"),
      ),
    )
    .orderBy(asc(approvalSteps.stepOrder))
    .limit(1);
  if (!step) throw new AppError("APPROVAL_STATE", "No pending step to act on.");

  await tx
    .update(approvalSteps)
    .set({
      state: decision,
      actedOn: new Date(),
      approverId: session.id,
      note: input.note ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(approvalSteps.id, step.id), eq(approvalSteps.orgId, session.orgId)));

  // Recompute the request state from ALL of its steps: any rejected -> rejected;
  // all approved -> approved; otherwise it stays pending (awaiting the next approver).
  const steps = await tx
    .select({ state: approvalSteps.state })
    .from(approvalSteps)
    .where(
      and(
        eq(approvalSteps.approvalRequestId, request.id),
        eq(approvalSteps.orgId, session.orgId),
      ),
    );

  const requestState: "pending" | "approved" | "rejected" = steps.some(
    (s) => s.state === "rejected",
  )
    ? "rejected"
    : steps.every((s) => s.state === "approved")
      ? "approved"
      : "pending";

  if (requestState !== request.state) {
    await tx
      .update(approvalRequests)
      .set({ state: requestState, updatedAt: new Date() })
      .where(and(eq(approvalRequests.id, request.id), eq(approvalRequests.orgId, session.orgId)));
  }

  return { request, requestState };
}

/** Record + notify the requester for a decision that the caller has already applied. */
async function recordDecision(
  tx: Tx,
  request: typeof approvalRequests.$inferSelect,
  requestState: "pending" | "approved" | "rejected",
  decision: Decision,
  session: SessionUser,
) {
  const verb = decision === "approved" ? "approved" : "rejected";

  await insertAudit(tx, {
    orgId: session.orgId,
    actorId: session.id,
    action: `${request.type}.${verb}`,
    entityType: request.type,
    entityId: request.entityId,
    diff: { after: { requestState } },
  });
  await insertActivity(tx, {
    orgId: session.orgId,
    actorId: session.id,
    verb,
    targetType: request.type,
    targetId: request.entityId,
    summary: `${verb === "approved" ? "Approved" : "Rejected"} "${request.title}"`,
  });

  // Keep the requester in the loop on every decision, even mid-chain.
  await insertNotification(tx, {
    orgId: session.orgId,
    recipientId: request.requesterId,
    kind: "approval",
    title:
      requestState === "approved"
        ? `${request.type === "offer" ? "Offer" : "Requisition"} approved`
        : requestState === "rejected"
          ? `${request.type === "offer" ? "Offer" : "Requisition"} rejected`
          : "Approval step decided",
    body: request.title,
    href: "/approvals",
  });
}

/** Approve the current step of a requisition request; open the requisition once fully approved. */
export async function approveRequisition(input: ApprovalDecisionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const { request, requestState } = await decide(tx, input, "requisition", "approved", session);

    if (requestState === "approved") {
      await tx
        .update(requisitions)
        .set({ status: "open", updatedAt: new Date() })
        .where(and(eq(requisitions.id, request.entityId), eq(requisitions.orgId, session.orgId)));
    }

    await recordDecision(tx, request, requestState, "approved", session);
    return { id: request.id, state: requestState };
  });
}

/** Reject a requisition request; close the requisition immediately. */
export async function rejectRequisition(input: ApprovalDecisionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const { request, requestState } = await decide(tx, input, "requisition", "rejected", session);

    if (requestState === "rejected") {
      await tx
        .update(requisitions)
        .set({ status: "closed", updatedAt: new Date() })
        .where(and(eq(requisitions.id, request.entityId), eq(requisitions.orgId, session.orgId)));
    }

    await recordDecision(tx, request, requestState, "rejected", session);
    return { id: request.id, state: requestState };
  });
}

/** Approve the current step of an offer request; mark the offer approved once fully approved. */
export async function approveOffer(input: ApprovalDecisionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const { request, requestState } = await decide(tx, input, "offer", "approved", session);

    if (requestState === "approved") {
      await tx
        .update(offers)
        .set({ status: "approved", updatedAt: new Date() })
        .where(and(eq(offers.id, request.entityId), eq(offers.orgId, session.orgId)));
      // TODO(offers): trigger sendOffer when the Offers module lands
    }

    await recordDecision(tx, request, requestState, "approved", session);
    return { id: request.id, state: requestState };
  });
}

/** Reject an offer request (the offer's own status transition lands with the Offers module). */
export async function rejectOffer(input: ApprovalDecisionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const { request, requestState } = await decide(tx, input, "offer", "rejected", session);

    if (requestState === "rejected") {
      await tx
        .update(offers)
        .set({ status: "declined", updatedAt: new Date() })
        .where(and(eq(offers.id, request.entityId), eq(offers.orgId, session.orgId)));
    }

    await recordDecision(tx, request, requestState, "rejected", session);
    return { id: request.id, state: requestState };
  });
}
