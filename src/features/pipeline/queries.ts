// server-only: Drizzle reads for RSC pages (BACKEND-ARCHITECTURE.md §7.1–7.2). Org-scoped
// (Drizzle bypasses RLS). `daysInStage` is derived from the latest candidate_stage_history
// row, never stored.
import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { candidates, candidateStageHistory } from "@/lib/db/schema";
import type { Candidate } from "@/types/domain";

/** Every candidate across the board, in canonical order. The view groups by stage client-side. */
export async function getPipeline(orgId: string): Promise<Candidate[]> {
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
    .where(eq(candidates.orgId, orgId))
    .orderBy(asc(candidates.appliedOn));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    role: r.role,
    requisitionId: r.requisitionId ?? "",
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
