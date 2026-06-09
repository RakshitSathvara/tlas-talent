// server-only: the only place offer business rules live (BACKEND-ARCHITECTURE.md §8). Every
// write runs in a transaction with its audit + activity rows (and notifications where relevant),
// so the change and its record commit atomically. The approval-chain side (decisions, and the
// offers.status='approved' flip on completion) is owned by the Approvals module; submitForApproval
// here only materializes the chain, and sendOffer is the separate post-approval dispatch step.
import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  approvalChainConfig,
  approvalRequests,
  approvalSteps,
  candidates,
  offers,
  users,
} from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { insertNotification } from "@/lib/db/repositories/notifications";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";
import type {
  DraftOfferInput,
  SubmitForApprovalInput,
  SendOfferInput,
  WithdrawOfferInput,
} from "./types";

// Fallback chain when no `approval_chain_config` row matches the offer's band (mirrors the
// reference HR -> TL -> CEO ladder; the named approver is resolved at decision time).
const DEFAULT_OFFER_CHAIN = ["HR", "TL", "CEO"];

/**
 * Draft an offer for a candidate. Opens at status 'draft'; terms are stored on the offer row
 * (terms_ctc in canonical INR rupees, per the money convention). No approval chain is created
 * until submitForApproval.
 */
export async function draftOffer(input: DraftOfferInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [cand] = await tx
      .select({ id: candidates.id, name: candidates.name, role: candidates.role })
      .from(candidates)
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);
    if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");

    const [offer] = await tx
      .insert(offers)
      .values({
        orgId: session.orgId,
        candidateId: input.candidateId,
        requisitionId: input.requisitionId ?? null,
        status: "draft",
        termsBand: input.terms.band,
        termsCtc: String(input.terms.ctc),
        termsLocation: input.terms.location,
        termsJoiningDate: input.terms.joiningDate,
        termsType: input.terms.type,
      })
      .returning({ id: offers.id });

    if (!offer) throw new AppError("INTERNAL", "Failed to draft offer.");

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "offer.drafted",
      entityType: "offer",
      entityId: offer.id,
      diff: { after: { candidateId: input.candidateId, status: "draft", terms: input.terms } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "drafted",
      targetType: "offer",
      targetId: offer.id,
      summary: `Drafted offer for "${cand.name}"`,
    });

    return { id: offer.id, status: "draft" as const };
  });
}

/**
 * Submit a draft offer for approval. Moves it to 'pending_approval', materializes the approval
 * chain (from approval_chain_config matched on the offer's band, else a default ladder) into one
 * approval_requests + its approval_steps, and notifies the leadership/admin approvers.
 */
export async function submitForApproval(input: SubmitForApprovalInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [offer] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.id, input.offerId), eq(offers.orgId, session.orgId)))
      .limit(1);
    if (!offer) throw new AppError("NOT_FOUND", "Offer not found.");
    if (offer.status !== "draft") {
      throw new AppError("CONFLICT", "Only a draft offer can be submitted for approval.");
    }

    const [cand] = await tx
      .select({ name: candidates.name, role: candidates.role })
      .from(candidates)
      .where(and(eq(candidates.id, offer.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);
    if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");

    // Resolve the chain for the offer's band; fall back to the default ladder when unconfigured.
    let chain: string[] = DEFAULT_OFFER_CHAIN;
    if (offer.termsBand) {
      const [cfg] = await tx
        .select()
        .from(approvalChainConfig)
        .where(
          and(
            eq(approvalChainConfig.orgId, session.orgId),
            eq(approvalChainConfig.band, offer.termsBand),
          ),
        )
        .limit(1);
      if (cfg && cfg.chain.length > 0) chain = cfg.chain;
    }

    await tx
      .update(offers)
      .set({ status: "pending_approval", updatedAt: new Date() })
      .where(and(eq(offers.id, offer.id), eq(offers.orgId, session.orgId)));

    const [ar] = await tx
      .insert(approvalRequests)
      .values({
        orgId: session.orgId,
        type: "offer",
        entityId: offer.id,
        requesterId: session.id,
        title: `${cand.name} · ${cand.role}`,
        subtitle: offer.termsLocation ?? null,
        amount: offer.termsCtc, // already numeric (INR rupees)
        state: "pending",
      })
      .returning({ id: approvalRequests.id });

    if (ar) {
      await tx.insert(approvalSteps).values(
        chain.map((label, i) => ({
          orgId: session.orgId,
          approvalRequestId: ar.id,
          stepOrder: i + 1,
          role: label,
          state: "pending" as const,
        })),
      );
    }

    // Approvers (leadership/admin) own the approvals queue — notify them.
    const approvers = await tx
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.orgId, session.orgId),
          inArray(users.role, ["leadership", "admin"]),
          eq(users.isActive, true),
        ),
      );
    for (const a of approvers) {
      await insertNotification(tx, {
        orgId: session.orgId,
        recipientId: a.id,
        kind: "offer",
        title: "Offer needs approval",
        body: `${cand.name} · ${cand.role}`,
        href: "/approvals",
      });
    }

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "offer.submitted_for_approval",
      entityType: "offer",
      entityId: offer.id,
      diff: { before: { status: offer.status }, after: { status: "pending_approval" } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "submitted",
      targetType: "offer",
      targetId: offer.id,
      summary: `Submitted offer for "${cand.name}" for approval`,
    });

    return { id: offer.id, status: "pending_approval" as const };
  });
}

/**
 * Send an approved offer to the candidate. Leadership/admin (approveOffer) may always send; HR
 * and admin may send once the offer is 'approved' (the Approvals module flips that on chain
 * completion). Sets status 'sent'. Actual PDF + email dispatch is deferred.
 */
export async function sendOffer(input: SendOfferInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [offer] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.id, input.offerId), eq(offers.orgId, session.orgId)))
      .limit(1);
    if (!offer) throw new AppError("NOT_FOUND", "Offer not found.");
    if (offer.status !== "approved") {
      throw new AppError("CONFLICT", "Only an approved offer can be sent to the candidate.");
    }

    const [cand] = await tx
      .select({ name: candidates.name })
      .from(candidates)
      .where(and(eq(candidates.id, offer.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);

    await tx
      .update(offers)
      .set({ status: "sent", updatedAt: new Date() })
      .where(and(eq(offers.id, offer.id), eq(offers.orgId, session.orgId)));

    // TODO: generate PDF to Storage + email candidate via Resend

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "offer.sent",
      entityType: "offer",
      entityId: offer.id,
      diff: { before: { status: offer.status }, after: { status: "sent" } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "sent",
      targetType: "offer",
      targetId: offer.id,
      summary: `Sent offer to "${cand?.name ?? "candidate"}"`,
    });

    return { id: offer.id, status: "sent" as const };
  });
}

/** Withdraw an offer (any pre-final state). Sets status 'withdrawn'. */
export async function withdrawOffer(input: WithdrawOfferInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [offer] = await tx
      .select()
      .from(offers)
      .where(and(eq(offers.id, input.offerId), eq(offers.orgId, session.orgId)))
      .limit(1);
    if (!offer) throw new AppError("NOT_FOUND", "Offer not found.");
    if (offer.status === "withdrawn") {
      throw new AppError("CONFLICT", "Offer is already withdrawn.");
    }
    if (offer.status === "accepted" || offer.status === "declined") {
      throw new AppError("CONFLICT", "A resolved offer can't be withdrawn.");
    }

    const [cand] = await tx
      .select({ name: candidates.name })
      .from(candidates)
      .where(and(eq(candidates.id, offer.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);

    await tx
      .update(offers)
      .set({ status: "withdrawn", updatedAt: new Date() })
      .where(and(eq(offers.id, offer.id), eq(offers.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "offer.withdrawn",
      entityType: "offer",
      entityId: offer.id,
      diff: { before: { status: offer.status }, reason: input.reason ?? null },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "withdrawn",
      targetType: "offer",
      targetId: offer.id,
      summary: `Withdrew offer for "${cand?.name ?? "candidate"}"`,
    });

    return { id: offer.id, status: "withdrawn" as const };
  });
}
