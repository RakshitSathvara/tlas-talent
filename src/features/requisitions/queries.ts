// server-only: Drizzle reads for RSC pages (BACKEND-ARCHITECTURE.md §7.1–7.2). Every query is
// explicitly org-scoped (Drizzle bypasses RLS). `pipeline`, `filled`, and `days_open` are
// derived in SQL, never stored.
import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  requisitions,
  candidates,
  candidateStageHistory,
  approvalRequests,
  approvalSteps,
  users,
} from "@/lib/db/schema";
import type { ApprovalStep, Candidate, Requisition } from "@/types/domain";

/** Every requisition for the org, in the domain shape the list UI consumes. */
export async function listRequisitions(orgId: string): Promise<Requisition[]> {
  const rows = await db
    .select({
      id: requisitions.id,
      title: requisitions.title,
      team: requisitions.team,
      location: requisitions.location,
      openings: requisitions.openings,
      status: requisitions.status,
      priority: requisitions.priority,
      band: requisitions.band,
      description: requisitions.description,
      raisedOn: requisitions.raisedOn,
      raisedByName: users.name,
      daysOpen: sql<number>`(current_date - ${requisitions.raisedOn}::date)`.mapWith(Number),
      pipeline: sql<number>`(
        select count(*) from ${candidates} c
        where c.requisition_id = ${requisitions.id} and c.org_id = ${requisitions.orgId}
          and c.stage not in ('hired','rejected')
      )`.mapWith(Number),
      filled: sql<number>`(
        select count(*) from ${candidates} c
        where c.requisition_id = ${requisitions.id} and c.org_id = ${requisitions.orgId}
          and c.stage = 'hired'
      )`.mapWith(Number),
    })
    .from(requisitions)
    .leftJoin(users, eq(users.id, requisitions.raisedBy))
    .where(eq(requisitions.orgId, orgId))
    .orderBy(desc(requisitions.raisedOn));

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    team: r.team,
    location: r.location,
    openings: r.openings,
    filled: r.filled,
    daysOpen: r.daysOpen,
    pipeline: r.pipeline,
    status: r.status,
    priority: r.priority,
    band: r.band ?? "",
    raisedBy: r.raisedByName ?? "—",
    raisedOn: r.raisedOn.toISOString().slice(0, 10),
    description: r.description ?? undefined,
  }));
}

/** A single requisition for the detail page, or null when absent / out of org. */
export async function getRequisition(orgId: string, id: string): Promise<Requisition | null> {
  const all = await listRequisitions(orgId);
  return all.find((r) => r.id === id) ?? null;
}

/** The candidates attached to a requisition (domain shape), with derived days-in-stage. */
export async function getApplicants(orgId: string, reqId: string): Promise<Candidate[]> {
  const rows = await db
    .select({
      id: candidates.id,
      name: candidates.name,
      role: candidates.role,
      requisitionId: candidates.requisitionId,
      stage: candidates.stage,
      experience: candidates.experience,
      location: candidates.location,
      email: candidates.email,
      phone: candidates.phone,
      source: candidates.source,
      appliedOn: candidates.appliedOn,
      expectedCtcDisplay: candidates.expectedCtcDisplay,
      noticePeriod: candidates.noticePeriod,
      summary: candidates.summary,
      initials: candidates.initials,
      tint: candidates.tint,
      daysInStage: sql<number>`coalesce((current_date - (
        select max(h.entered_on)::date from ${candidateStageHistory} h
        where h.candidate_id = ${candidates.id} and h.org_id = ${candidates.orgId}
      )), 0)`.mapWith(Number),
    })
    .from(candidates)
    .where(and(eq(candidates.orgId, orgId), eq(candidates.requisitionId, reqId)))
    .orderBy(asc(candidates.appliedOn));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    requisitionId: r.requisitionId ?? reqId,
    stage: r.stage,
    experience: r.experience ?? "",
    location: r.location ?? "",
    email: r.email,
    phone: r.phone ?? "",
    source: r.source ?? "",
    daysInStage: r.daysInStage,
    appliedOn: r.appliedOn.toISOString().slice(0, 10),
    initials: r.initials,
    tint: r.tint,
    expectedCtc: r.expectedCtcDisplay ?? undefined,
    noticePeriod: r.noticePeriod ?? undefined,
    summary: r.summary ?? undefined,
  }));
}

/** The ordered approval steps for a requisition's request (domain shape; empty if auto-opened). */
export async function getRequisitionApprovalChain(
  orgId: string,
  reqId: string,
): Promise<ApprovalStep[]> {
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
        eq(approvalRequests.type, "requisition"),
        eq(approvalRequests.entityId, reqId),
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
