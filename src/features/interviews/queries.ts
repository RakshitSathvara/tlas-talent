// server-only: Drizzle reads for the interviews board + detail RSC pages
// (BACKEND-ARCHITECTURE.md §7.1–7.2). Every query is explicitly org-scoped (Drizzle bypasses
// RLS). The interview domain shape derives date/time strings from scheduled_at, round as
// "Round N", duration as "N min", and the 'today' display status (scheduled_at::date =
// current_date && stored status 'upcoming'). Cancelled interviews have no domain status, so
// they're filtered out of list reads.
import "server-only";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  candidates,
  feedback,
  interviews,
  interviewPanelists,
  users,
} from "@/lib/db/schema";
import type { Feedback, Interview } from "@/types/domain";
import type { InterviewStatus } from "@/types/enums";

/** The full interview list for the org (cancelled dropped). The view tabs over status. */
export async function listInterviews(orgId: string): Promise<Interview[]> {
  const rows = await db
    .select({
      id: interviews.id,
      candidateId: interviews.candidateId,
      candidate: candidates.name,
      role: candidates.role,
      requisitionId: interviews.requisitionId,
      scheduledAt: interviews.scheduledAt,
      round: interviews.round,
      durationMinutes: interviews.durationMinutes,
      mode: interviews.mode,
      status: interviews.status,
      initials: candidates.initials,
      tint: candidates.tint,
      // 'today' is derived at read time, never stored (BACKEND-ARCHITECTURE.md §5.2).
      isToday: sql<boolean>`${interviews.scheduledAt}::date = current_date`.mapWith(Boolean),
    })
    .from(interviews)
    .innerJoin(candidates, eq(candidates.id, interviews.candidateId))
    .where(
      and(
        eq(interviews.orgId, orgId),
        // Cancelled interviews are dropped from the board (no domain status for them).
        sql`${interviews.status} <> 'cancelled'`,
      ),
    )
    .orderBy(asc(interviews.scheduledAt));

  return mapInterviews(orgId, rows);
}

/** A single interview by id (org-scoped), or null for the detail page to notFound() on. */
export async function getInterview(orgId: string, id: string): Promise<Interview | null> {
  const rows = await db
    .select({
      id: interviews.id,
      candidateId: interviews.candidateId,
      candidate: candidates.name,
      role: candidates.role,
      requisitionId: interviews.requisitionId,
      scheduledAt: interviews.scheduledAt,
      round: interviews.round,
      durationMinutes: interviews.durationMinutes,
      mode: interviews.mode,
      status: interviews.status,
      initials: candidates.initials,
      tint: candidates.tint,
      isToday: sql<boolean>`${interviews.scheduledAt}::date = current_date`.mapWith(Boolean),
    })
    .from(interviews)
    .innerJoin(candidates, eq(candidates.id, interviews.candidateId))
    .where(
      and(
        eq(interviews.orgId, orgId),
        eq(interviews.id, id),
        // A cancelled interview has no domain status — surface it as absent.
        sql`${interviews.status} <> 'cancelled'`,
      ),
    )
    .limit(1);

  const mapped = await mapInterviews(orgId, rows);
  return mapped[0] ?? null;
}

/** Panel feedback recorded against a single interview, newest first (domain shape). */
export async function getInterviewFeedback(orgId: string, id: string): Promise<Feedback[]> {
  const rows = await db
    .select({
      id: feedback.id,
      interviewId: feedback.interviewId,
      candidateId: feedback.candidateId,
      interviewerName: users.name,
      round: feedback.round,
      ratingTechnical: feedback.ratingTechnical,
      ratingCommunication: feedback.ratingCommunication,
      ratingRoleFit: feedback.ratingRoleFit,
      ratingCultural: feedback.ratingCultural,
      recommendation: feedback.recommendation,
      notes: feedback.notes,
      submittedAt: feedback.submittedAt,
    })
    .from(feedback)
    .leftJoin(users, eq(users.id, feedback.interviewerId))
    .where(and(eq(feedback.orgId, orgId), eq(feedback.interviewId, id)))
    .orderBy(sql`${feedback.submittedAt} desc`);

  return rows.map((r) => ({
    id: r.id,
    interviewId: r.interviewId,
    candidateId: r.candidateId,
    interviewer: r.interviewerName ?? "—",
    round: `Round ${r.round}`,
    ratings: {
      technical: r.ratingTechnical,
      communication: r.ratingCommunication,
      roleFit: r.ratingRoleFit,
      cultural: r.ratingCultural,
    },
    recommendation: r.recommendation,
    notes: r.notes ?? "",
    submittedOn: r.submittedAt.toISOString().slice(0, 10),
  }));
}

/** Attach panel names (one round-trip) and map interview rows to the bare domain shape. */
async function mapInterviews(
  orgId: string,
  rows: {
    id: string;
    candidateId: string;
    candidate: string;
    role: string;
    requisitionId: string | null;
    scheduledAt: Date;
    round: number;
    durationMinutes: number;
    mode: Interview["mode"];
    status: "upcoming" | "pending_feedback" | "completed" | "cancelled";
    initials: string;
    tint: string;
    isToday: boolean;
  }[],
): Promise<Interview[]> {
  // Panelist names per interview, in one round-trip, then grouped in memory.
  const ids = rows.map((r) => r.id);
  const panel = ids.length
    ? await db
        .select({ interviewId: interviewPanelists.interviewId, name: users.name })
        .from(interviewPanelists)
        .innerJoin(users, eq(users.id, interviewPanelists.userId))
        .where(eq(interviewPanelists.orgId, orgId))
    : [];
  const panelByInterview = new Map<string, string[]>();
  for (const p of panel) {
    const list = panelByInterview.get(p.interviewId) ?? [];
    if (p.name) list.push(p.name);
    panelByInterview.set(p.interviewId, list);
  }

  return rows.map((r) => ({
    id: r.id,
    candidateId: r.candidateId,
    candidate: r.candidate,
    role: r.role,
    requisitionId: r.requisitionId ?? "",
    time: r.scheduledAt.toISOString().slice(11, 16),
    date: r.scheduledAt.toISOString().slice(0, 10),
    round: `Round ${r.round}`,
    duration: `${r.durationMinutes} min`,
    mode: r.mode,
    // The stored enum has no 'today'; surface it when the interview is upcoming and dated today.
    // ('cancelled' is filtered out before this point, so the remaining values are valid statuses.)
    status: (r.isToday && r.status === "upcoming" ? "today" : r.status) as InterviewStatus,
    panel: panelByInterview.get(r.id) ?? [],
    initials: r.initials,
    tint: r.tint,
  }));
}
