// server-only: Drizzle reads for the role-branched /dashboard RSC (BACKEND-ARCHITECTURE.md
// §7.1–7.2). Every query is explicitly org-scoped (Drizzle bypasses RLS); the interviewer and
// leadership reads are additionally user-scoped. Each function returns exactly the bare
// aggregates its dashboard component renders — never a Result. Stat counts, SLA breaches, and
// the activity "Xh ago" labels are derived in SQL/at read time, never stored.
import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  activities,
  auditLog,
  candidates,
  candidateStageHistory,
  interviews,
  interviewPanelists,
  offers,
  requisitions,
  stageConfig,
  templates,
  users,
} from "@/lib/db/schema";
import { getPendingApprovals } from "@/features/approvals/queries";
import { getReportingMetrics } from "@/features/reports/queries";
import type {
  Activity,
  Approval,
  AuditEntry,
  Candidate,
  FunnelStage,
  Interview,
  Requisition,
} from "@/types/domain";
import type { InterviewStatus } from "@/types/enums";

/* ───────────────────────────── Shared helpers ───────────────────────────── */

/** Compact "12m" / "2h" / "1d" age the activity + audit feeds render (frontend §11). */
function ago(at: Date): string {
  const mins = Math.max(0, Math.floor((Date.now() - at.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** The org's recent activity feed (newest first), in the bare Activity domain shape. */
async function getRecentActivity(orgId: string, limit = 7): Promise<Activity[]> {
  const rows = await db
    .select({
      id: activities.id,
      actorName: users.name,
      verb: activities.verb,
      summary: activities.summary,
      occurredAt: activities.occurredAt,
    })
    .from(activities)
    .leftJoin(users, eq(users.id, activities.actorId))
    .where(eq(activities.orgId, orgId))
    .orderBy(desc(activities.occurredAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    who: r.actorName ?? "System",
    // The feed renders `who what target` — verb is the action, summary the target phrase.
    what: r.verb,
    target: r.summary,
    when: ago(r.occurredAt),
  }));
}

/** Candidates past their stage SLA + open requisitions stalling — the "needs attention" list. */
async function getNeedsAttention(orgId: string): Promise<NeedsAttentionItem[]> {
  // SLA breaches: days-in-stage (derived from latest stage_history) past the stage's sla_days.
  const breaches = await db
    .select({
      id: candidates.id,
      name: candidates.name,
      stage: candidates.stage,
      label: stageConfig.label,
      slaDays: stageConfig.slaDays,
      daysInStage: sql<number>`coalesce((current_date - (
        select max(h.entered_on)::date from ${candidateStageHistory} h
        where h.candidate_id = ${candidates.id} and h.org_id = ${candidates.orgId}
      )), 0)`.mapWith(Number),
    })
    .from(candidates)
    .innerJoin(
      stageConfig,
      and(eq(stageConfig.orgId, candidates.orgId), eq(stageConfig.stage, candidates.stage)),
    )
    .where(eq(candidates.orgId, orgId));

  const sla: NeedsAttentionItem[] = breaches.flatMap((c) => {
    if (c.slaDays == null || c.slaDays <= 0 || c.daysInStage <= c.slaDays) return [];
    const over = c.daysInStage - c.slaDays;
    return [
      {
        href: `/candidates/${c.id}`,
        title: `${c.name} · ${c.label}`,
        note: `SLA breached by ${over} day${over > 1 ? "s" : ""}`,
      },
    ];
  });

  // Stalled requisitions: still open after 18+ days.
  const stalledRows = await db
    .select({
      id: requisitions.id,
      title: requisitions.title,
      daysOpen: sql<number>`(current_date - ${requisitions.raisedOn}::date)`.mapWith(Number),
    })
    .from(requisitions)
    .where(and(eq(requisitions.orgId, orgId), eq(requisitions.status, "open")));

  const stalled: NeedsAttentionItem[] = stalledRows
    .filter((r) => r.daysOpen >= 18)
    .map((r) => ({
      href: `/requisitions/${r.id}`,
      title: r.title,
      note: `Open ${r.daysOpen} days — losing momentum`,
    }));

  return [...stalled, ...sla];
}

/* ───────────────────────────── HR dashboard ───────────────────────────── */

export interface NeedsAttentionItem {
  href: string;
  title: string;
  note: string;
}

export interface HrDashboardData {
  stats: {
    openRequisitions: number;
    activeCandidates: number;
    interviewsScheduled: number;
    interviewsToday: number;
    offersPending: number;
  };
  /** Every candidate on the board (the view groups by stage + filters by team client-side). */
  candidates: Candidate[];
  /** requisitionId -> team, so the board's team filter can map candidates to roles. */
  reqTeams: { requisitionId: string; team: string }[];
  activity: Activity[];
  needsAttention: NeedsAttentionItem[];
}

/** The hiring-desk view: top-of-funnel counts, the full pipeline, activity + needs-attention. */
export async function getHrDashboard(orgId: string): Promise<HrDashboardData> {
  const [
    openReqRow,
    activeRow,
    interviewRow,
    offerRow,
    candidateRows,
    reqTeamRows,
    activity,
    needsAttention,
  ] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(requisitions)
      .where(and(eq(requisitions.orgId, orgId), eq(requisitions.status, "open"))),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(candidates)
      .where(
        and(eq(candidates.orgId, orgId), sql`${candidates.stage} not in ('hired','rejected')`),
      ),
    db
      .select({
        scheduled: sql<number>`count(*) filter (where ${interviews.status} = 'upcoming')`.mapWith(
          Number,
        ),
        today:
          sql<number>`count(*) filter (where ${interviews.status} = 'upcoming' and ${interviews.scheduledAt}::date = current_date)`.mapWith(
            Number,
          ),
      })
      .from(interviews)
      .where(eq(interviews.orgId, orgId)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(offers)
      .where(and(eq(offers.orgId, orgId), eq(offers.status, "pending_approval"))),
    getBoardCandidates(orgId),
    db
      .select({ requisitionId: requisitions.id, team: requisitions.team })
      .from(requisitions)
      .where(eq(requisitions.orgId, orgId)),
    getRecentActivity(orgId),
    getNeedsAttention(orgId),
  ]);

  return {
    stats: {
      openRequisitions: openReqRow[0]?.n ?? 0,
      activeCandidates: activeRow[0]?.n ?? 0,
      interviewsScheduled: interviewRow[0]?.scheduled ?? 0,
      interviewsToday: interviewRow[0]?.today ?? 0,
      offersPending: offerRow[0]?.n ?? 0,
    },
    candidates: candidateRows,
    reqTeams: reqTeamRows,
    activity,
    needsAttention,
  };
}

/** The full candidate board for the org (same derivation as pipeline.getPipeline). */
async function getBoardCandidates(orgId: string): Promise<Candidate[]> {
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

/* ───────────────────────────── Leadership dashboard ───────────────────────────── */

export interface LeadershipDashboardData {
  /** Everything awaiting this leader's sign-off (pending requisitions + offers). */
  approvals: Approval[];
  /** The requisitions this leader raised that aren't yet filled. */
  myRequisitions: Requisition[];
  funnel: FunnelStage[];
  timeToHireSeries: number[];
  offerAcceptance: { accepted: number; total: number };
  reportHeadline: { medianDaysToHire: number; deltaPct: number; offerAcceptanceRate: number };
}

/** Leadership view: the approval queue, this leader's open requisitions, and velocity charts. */
export async function getLeadershipDashboard(
  orgId: string,
  userId: string,
): Promise<LeadershipDashboardData> {
  // Velocity charts reuse the org-scoped reporting rollups (reports.queries); the dashboard
  // shows the funnel, time-to-hire sparkline, and offer-acceptance slices of that bundle.
  const [approvals, myRequisitions, metrics] = await Promise.all([
    getPendingApprovals(orgId),
    getMyRequisitions(orgId, userId),
    getReportingMetrics(orgId),
  ]);
  const { funnel, timeToHireSeries, offerAcceptance, reportHeadline } = metrics;

  return {
    approvals,
    myRequisitions,
    funnel,
    timeToHireSeries,
    offerAcceptance,
    reportHeadline,
  };
}

/** The requisitions this leader raised that are still in flight (not yet filled). */
async function getMyRequisitions(orgId: string, userId: string): Promise<Requisition[]> {
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
    .where(
      and(
        eq(requisitions.orgId, orgId),
        eq(requisitions.raisedBy, userId),
        sql`${requisitions.status} <> 'filled'`,
      ),
    )
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

/* ───────────────────────────── Interviewer dashboard ───────────────────────────── */

export interface InterviewerDashboardData {
  /** Interviews this user is on the panel for, today/upcoming/pending (cancelled dropped). */
  interviews: Interview[];
  /** Past interviews this user has sat on — the "Past" tab count. */
  pastCount: number;
}

/** This interviewer's day: today's slots, upcoming, and feedback they still owe. */
export async function getInterviewerDashboard(
  orgId: string,
  userId: string,
): Promise<InterviewerDashboardData> {
  // Only the interviews this user is panelling — join through interview_panelists (org-scoped).
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
    .from(interviewPanelists)
    .innerJoin(interviews, eq(interviews.id, interviewPanelists.interviewId))
    .innerJoin(candidates, eq(candidates.id, interviews.candidateId))
    .where(
      and(
        eq(interviewPanelists.orgId, orgId),
        eq(interviewPanelists.userId, userId),
        sql`${interviews.status} <> 'cancelled'`,
      ),
    )
    .orderBy(asc(interviews.scheduledAt));

  const interviewIds = rows.map((r) => r.id);
  const panelByInterview = await getPanelNames(orgId, interviewIds);

  const list: Interview[] = rows.map((r) => ({
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
    // No stored 'today' — surface it for upcoming interviews dated today.
    status: (r.isToday && r.status === "upcoming" ? "today" : r.status) as InterviewStatus,
    panel: panelByInterview.get(r.id) ?? [],
    initials: r.initials,
    tint: r.tint,
  }));

  // Completed interviews this user sat on — the "Past" tab count.
  const [pastRow] = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(interviewPanelists)
    .innerJoin(interviews, eq(interviews.id, interviewPanelists.interviewId))
    .where(
      and(
        eq(interviewPanelists.orgId, orgId),
        eq(interviewPanelists.userId, userId),
        eq(interviews.status, "completed"),
      ),
    );

  return { interviews: list, pastCount: pastRow?.n ?? 0 };
}

/** Panelist names grouped per interview (one round-trip). */
async function getPanelNames(
  orgId: string,
  interviewIds: string[],
): Promise<Map<string, string[]>> {
  const byInterview = new Map<string, string[]>();
  if (interviewIds.length === 0) return byInterview;

  const panel = await db
    .select({ interviewId: interviewPanelists.interviewId, name: users.name })
    .from(interviewPanelists)
    .innerJoin(users, eq(users.id, interviewPanelists.userId))
    .where(
      and(
        eq(interviewPanelists.orgId, orgId),
        inArray(interviewPanelists.interviewId, interviewIds),
      ),
    );

  for (const p of panel) {
    const list = byInterview.get(p.interviewId) ?? [];
    if (p.name) list.push(p.name);
    byInterview.set(p.interviewId, list);
  }
  return byInterview;
}

/* ───────────────────────────── Admin dashboard ───────────────────────────── */

export interface AdminDashboardData {
  stats: {
    people: number;
    requisitions: number;
    templates: number;
    auditEvents: number;
  };
  /** The most recent audit-log entries (newest first) for the system-activity panel. */
  recentAudit: AuditEntry[];
}

/** The system-at-a-glance view: per-table counts plus the recent audit trail. */
export async function getAdminDashboard(orgId: string): Promise<AdminDashboardData> {
  const [peopleRow, reqRow, templateRow, auditRow, recentAudit] = await Promise.all([
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(users)
      .where(eq(users.orgId, orgId)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(requisitions)
      .where(eq(requisitions.orgId, orgId)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(templates)
      .where(eq(templates.orgId, orgId)),
    db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(auditLog)
      .where(eq(auditLog.orgId, orgId)),
    getRecentAudit(orgId),
  ]);

  return {
    stats: {
      people: peopleRow[0]?.n ?? 0,
      requisitions: reqRow[0]?.n ?? 0,
      templates: templateRow[0]?.n ?? 0,
      auditEvents: auditRow[0]?.n ?? 0,
    },
    recentAudit,
  };
}

/** The most recent audit-log entries (newest first), in the bare AuditEntry domain shape. */
async function getRecentAudit(orgId: string, limit = 6): Promise<AuditEntry[]> {
  const rows = await db
    .select({
      id: auditLog.id,
      actorName: users.name,
      action: auditLog.action,
      entityType: auditLog.entityType,
      entityId: auditLog.entityId,
      at: auditLog.at,
    })
    .from(auditLog)
    .leftJoin(users, eq(users.id, auditLog.actorId))
    .where(eq(auditLog.orgId, orgId))
    .orderBy(desc(auditLog.at))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    actor: r.actorName ?? "System",
    action: r.action,
    // The panel prints the entity type capitalised ("Offer", "Candidate", ...).
    entity: r.entityType.charAt(0).toUpperCase() + r.entityType.slice(1),
    entityId: r.entityId,
    // 'YYYY-MM-DD HH:MM' — the panel slices off the year via .slice(5).
    at: `${r.at.toISOString().slice(0, 10)} ${r.at.toISOString().slice(11, 16)}`,
  }));
}
