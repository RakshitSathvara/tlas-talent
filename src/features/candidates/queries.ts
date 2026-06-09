// server-only: Drizzle reads for the candidate directory + detail RSC pages
// (BACKEND-ARCHITECTURE.md §7.1–7.2). Every query is explicitly org-scoped (Drizzle bypasses
// RLS). `daysInStage` is derived in SQL, the timeline's `current` flag from the latest history
// row, and the interview `status: 'today'` from scheduled_at::date = current_date.
import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  candidates,
  candidateStageHistory,
  feedback,
  files,
  interviews,
  interviewPanelists,
  users,
} from "@/lib/db/schema";
import type { Candidate, Feedback, Interview, StageEvent } from "@/types/domain";
import type { InterviewStatus, StageKey } from "@/types/enums";
import type { ResumeFile } from "./types";

/** The full candidate directory for the org. Filtering happens client-side in the directory island. */
export async function searchCandidates(orgId: string): Promise<Candidate[]> {
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
    .orderBy(desc(candidates.appliedOn));

  return rows.map(toCandidate);
}

/** A single candidate by id (org-scoped), or null for the detail page to notFound() on. */
export async function getCandidate(orgId: string, id: string): Promise<Candidate | null> {
  const [row] = await db
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
    .where(and(eq(candidates.orgId, orgId), eq(candidates.id, id)))
    .limit(1);

  return row ? toCandidate(row) : null;
}

/** The data-driven stage timeline for a candidate; latest history row flagged `current`. */
export async function getCandidateTimeline(orgId: string, id: string): Promise<StageEvent[]> {
  const rows = await db
    .select({
      stage: candidateStageHistory.stage,
      enteredOn: candidateStageHistory.enteredOn,
      note: candidateStageHistory.note,
    })
    .from(candidateStageHistory)
    .where(
      and(eq(candidateStageHistory.orgId, orgId), eq(candidateStageHistory.candidateId, id)),
    )
    .orderBy(asc(candidateStageHistory.enteredOn));

  return rows.map((r, i) => ({
    stage: r.stage,
    enteredOn: r.enteredOn.toISOString().slice(0, 10),
    note: r.note ?? undefined,
    current: i === rows.length - 1,
  }));
}

/** Every feedback note filed against this candidate, newest first. */
export async function getCandidateFeedback(orgId: string, id: string): Promise<Feedback[]> {
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
    .where(and(eq(feedback.orgId, orgId), eq(feedback.candidateId, id)))
    .orderBy(desc(feedback.submittedAt));

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

/** Every interview scheduled for this candidate across rounds (domain shape). */
export async function getCandidateInterviews(orgId: string, id: string): Promise<Interview[]> {
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
        eq(interviews.candidateId, id),
        // Cancelled interviews are dropped from the candidate view (no domain status for them).
        sql`${interviews.status} <> 'cancelled'`,
      ),
    )
    .orderBy(asc(interviews.scheduledAt));

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
    // ('cancelled' is filtered out above, so the remaining values are all valid domain statuses.)
    status: (r.isToday && r.status === "upcoming" ? "today" : r.status) as InterviewStatus,
    panel: panelByInterview.get(r.id) ?? [],
    initials: r.initials,
    tint: r.tint,
  }));
}

/**
 * A redacted candidate brief for an interviewer (BACKEND-ARCHITECTURE.md §3.4). Deliberately
 * omits compensation (expected CTC) — panellists never see pay. `ownFeedback` is this
 * interviewer's own note(s) for the candidate; `othersFeedback` stays empty until the
 * interviewer has filed at least one note (no peeking at peers' scores before you've filed).
 */
export async function getCandidateBrief(
  orgId: string,
  candidateId: string,
  interviewerId: string,
): Promise<{
  name: string;
  role: string;
  experience: string;
  location: string;
  summary: string;
  stage: StageKey;
  ownFeedback: Feedback[];
  othersFeedback: Feedback[];
} | null> {
  const [cand] = await db
    .select({
      name: candidates.name,
      role: candidates.role,
      experience: candidates.experience,
      location: candidates.location,
      summary: candidates.summary,
      stage: candidates.stage,
    })
    .from(candidates)
    .where(and(eq(candidates.orgId, orgId), eq(candidates.id, candidateId)))
    .limit(1);
  if (!cand) return null;

  // Every note for the candidate (domain shape, name-mapped), plus the id set of this
  // interviewer's own rows so we can split "mine" from "everyone else's" without a name match.
  const all = await getCandidateFeedback(orgId, candidateId);
  const own = await db
    .select({ id: feedback.id })
    .from(feedback)
    .where(
      and(
        eq(feedback.orgId, orgId),
        eq(feedback.candidateId, candidateId),
        eq(feedback.interviewerId, interviewerId),
      ),
    );
  const ownIds = new Set(own.map((r) => r.id));
  const ownFeedback = all.filter((f) => ownIds.has(f.id));
  const hasFiled = ownIds.size > 0;

  return {
    name: cand.name,
    role: cand.role,
    experience: cand.experience ?? "",
    location: cand.location ?? "",
    summary: cand.summary ?? "",
    stage: cand.stage,
    ownFeedback,
    // Gate: peers' notes are only revealed once the interviewer has filed their own.
    othersFeedback: hasFiled ? all.filter((f) => !ownIds.has(f.id)) : [],
  };
}

/**
 * The candidate's most recently uploaded résumé file row (org-scoped), or null. The detail page
 * links to it via `/api/files/[id]`, which access-checks and mints a short-lived signed URL —
 * the bytes are never served directly here. The display file name is the last path segment with
 * its timestamp prefix stripped (paths are `${orgId}/${candidateId}/${ts}-${name}`).
 */
export async function getLatestResume(
  orgId: string,
  candidateId: string,
): Promise<ResumeFile | null> {
  const [row] = await db
    .select({
      id: files.id,
      storagePath: files.storagePath,
      contentType: files.contentType,
      sizeBytes: files.sizeBytes,
      createdAt: files.createdAt,
    })
    .from(files)
    .where(
      and(
        eq(files.orgId, orgId),
        eq(files.entityType, "candidate"),
        eq(files.entityId, candidateId),
        eq(files.storageBucket, "resumes"),
      ),
    )
    .orderBy(desc(files.createdAt))
    .limit(1);

  if (!row) return null;

  const last = row.storagePath.split("/").pop() ?? row.storagePath;
  const fileName = last.replace(/^\d+-/, "");

  return {
    id: row.id,
    fileName,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    uploadedOn: row.createdAt.toISOString().slice(0, 10),
  };
}

/** Map a candidate row (with derived daysInStage) to the bare domain shape. */
function toCandidate(r: {
  id: string;
  name: string;
  role: string;
  requisitionId: string | null;
  stage: Candidate["stage"];
  experience: string | null;
  location: string | null;
  email: string;
  phone: string | null;
  source: string | null;
  appliedOn: Date;
  expectedCtcDisplay: string | null;
  noticePeriod: string | null;
  summary: string | null;
  initials: string;
  tint: string;
  daysInStage: number;
}): Candidate {
  return {
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
  };
}
