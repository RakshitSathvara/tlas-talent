// server-only: Drizzle reads for the offers list + detail RSC pages (BACKEND-ARCHITECTURE.md
// §7.1–7.2). Every query is explicitly org-scoped (Drizzle bypasses RLS). The candidate name,
// role, initials, and tint are joined in; `terms` is composed from the terms_* columns
// (ctc numeric -> '₹28.5L' display via formatLakhs), and `approvalChain` is the ordered
// approval_steps of the offer's approval_requests row (type='offer', entity_id=offer.id).
import "server-only";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  offers,
  candidates,
  approvalRequests,
  approvalSteps,
  users,
} from "@/lib/db/schema";
import { formatLakhs } from "@/lib/format";
import type { ApprovalStep, Offer } from "@/types/domain";

// The offer row shape shared by list + detail, before terms/chain are composed.
type OfferRow = {
  id: string;
  candidateId: string;
  candidate: string;
  role: string;
  requisitionId: string | null;
  status: Offer["status"];
  termsBand: string | null;
  termsCtc: string | null;
  termsLocation: string | null;
  termsJoiningDate: string | null;
  termsType: string | null;
  createdOn: Date;
  initials: string;
  tint: string;
};

const OFFER_COLUMNS = {
  id: offers.id,
  candidateId: offers.candidateId,
  candidate: candidates.name,
  role: candidates.role,
  requisitionId: offers.requisitionId,
  status: offers.status,
  termsBand: offers.termsBand,
  termsCtc: offers.termsCtc,
  termsLocation: offers.termsLocation,
  termsJoiningDate: offers.termsJoiningDate,
  termsType: offers.termsType,
  createdOn: offers.createdOn,
  initials: candidates.initials,
  tint: candidates.tint,
} as const;

/** Every offer for the org, newest first, in the domain shape the list UI consumes. */
export async function listOffers(orgId: string): Promise<Offer[]> {
  const rows = await db
    .select(OFFER_COLUMNS)
    .from(offers)
    .innerJoin(candidates, eq(candidates.id, offers.candidateId))
    .where(eq(offers.orgId, orgId))
    .orderBy(desc(offers.createdOn));

  // Approval chains for all offers in one round-trip, grouped in memory.
  const chains = await getApprovalChains(orgId);
  return rows.map((r) => toOffer(r, chains.get(r.id) ?? []));
}

/** A single offer by id (org-scoped), or null for the detail page to notFound() on. */
export async function getOffer(orgId: string, id: string): Promise<Offer | null> {
  const [row] = await db
    .select(OFFER_COLUMNS)
    .from(offers)
    .innerJoin(candidates, eq(candidates.id, offers.candidateId))
    .where(and(eq(offers.orgId, orgId), eq(offers.id, id)))
    .limit(1);
  if (!row) return null;

  const chain = await getApprovalChain(orgId, id);
  return toOffer(row, chain);
}

/** The ordered approval steps for one offer's request (domain shape; empty if none raised yet). */
async function getApprovalChain(orgId: string, offerId: string): Promise<ApprovalStep[]> {
  const rows = await db
    .select({
      role: approvalSteps.role,
      state: approvalSteps.state,
      actedOn: approvalSteps.actedOn,
      approverName: users.name,
    })
    .from(approvalRequests)
    .innerJoin(approvalSteps, eq(approvalSteps.approvalRequestId, approvalRequests.id))
    .leftJoin(users, eq(users.id, approvalSteps.approverId))
    .where(
      and(
        eq(approvalRequests.orgId, orgId),
        eq(approvalRequests.type, "offer"),
        eq(approvalRequests.entityId, offerId),
      ),
    )
    .orderBy(asc(approvalSteps.stepOrder));

  return rows.map((r) => ({
    role: r.role,
    name: r.approverName ?? "—",
    state: r.state,
    actedOn: r.actedOn ? r.actedOn.toISOString().slice(0, 10) : undefined,
  }));
}

/** All offer approval chains for the org, keyed by entity (offer) id — one round-trip for the list. */
async function getApprovalChains(orgId: string): Promise<Map<string, ApprovalStep[]>> {
  const rows = await db
    .select({
      entityId: approvalRequests.entityId,
      stepOrder: approvalSteps.stepOrder,
      role: approvalSteps.role,
      state: approvalSteps.state,
      actedOn: approvalSteps.actedOn,
      approverName: users.name,
    })
    .from(approvalRequests)
    .innerJoin(approvalSteps, eq(approvalSteps.approvalRequestId, approvalRequests.id))
    .leftJoin(users, eq(users.id, approvalSteps.approverId))
    .where(and(eq(approvalRequests.orgId, orgId), eq(approvalRequests.type, "offer")))
    .orderBy(asc(approvalSteps.stepOrder));

  const byOffer = new Map<string, ApprovalStep[]>();
  for (const r of rows) {
    const list = byOffer.get(r.entityId) ?? [];
    list.push({
      role: r.role,
      name: r.approverName ?? "—",
      state: r.state,
      actedOn: r.actedOn ? r.actedOn.toISOString().slice(0, 10) : undefined,
    });
    byOffer.set(r.entityId, list);
  }
  return byOffer;
}

/** Map an offer row (+ its approval chain) to the bare domain shape. */
function toOffer(r: OfferRow, approvalChain: ApprovalStep[]): Offer {
  return {
    id: r.id,
    candidateId: r.candidateId,
    candidate: r.candidate,
    role: r.role,
    requisitionId: r.requisitionId ?? "",
    status: r.status,
    terms: {
      band: r.termsBand ?? "",
      // terms_ctc is canonical INR rupees (per the money convention); render lakhs for display.
      ctc: r.termsCtc != null ? formatLakhs(Number(r.termsCtc) / 100000) : "",
      location: r.termsLocation ?? "",
      joiningDate: r.termsJoiningDate ?? "",
      type: r.termsType ?? "",
    },
    createdOn: r.createdOn.toISOString().slice(0, 10),
    initials: r.initials,
    tint: r.tint,
    approvalChain,
  };
}
