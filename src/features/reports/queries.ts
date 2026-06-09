// server-only: Drizzle reads for the reports RSC page (BACKEND-ARCHITECTURE.md §7.1–7.2).
// Every series is computed from real org-scoped data — Drizzle bypasses RLS, so the org
// filter is mandatory on every query. The funnel, source-of-hire, interviewer-load and
// drop-off series are SQL aggregations; time-to-hire is derived from stage history.
import "server-only";
import { and, asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  candidates,
  candidateStageHistory,
  interviewPanelists,
  offers,
  users,
} from "@/lib/db/schema";
import { stageColors, STAGE_ORDER, stageLabels } from "@/lib/tokens";
import type { FunnelStage } from "@/types/domain";

/** The exact bundle the reports page destructures. */
export interface ReportingMetrics {
  funnel: FunnelStage[];
  /** Median days-to-hire over the last ten weeks (newest last) — the sparkline series. */
  timeToHireSeries: number[];
  offerAcceptance: { accepted: number; total: number };
  sourceOfHire: { label: string; value: number }[];
  interviewerLoad: { name: string; count: number }[];
  dropOffByStage: { stage: string; rate: number }[];
  reportHeadline: { medianDaysToHire: number; deltaPct: number; offerAcceptanceRate: number };
}

/** Bundles every reporting series HR rolls up for the quarterly read, all org-scoped. */
export async function getReportingMetrics(orgId: string): Promise<ReportingMetrics> {
  const [stageCounts, sourceRows, panelRows, offerRow, hireDurations] = await Promise.all([
    // Candidate counts per current stage — drives the funnel and drop-off series.
    db
      .select({ stage: candidates.stage, value: count() })
      .from(candidates)
      .where(eq(candidates.orgId, orgId))
      .groupBy(candidates.stage),
    // Hires grouped by acquisition source.
    db
      .select({ source: candidates.source, value: count() })
      .from(candidates)
      .where(eq(candidates.orgId, orgId))
      .groupBy(candidates.source)
      .orderBy(desc(count())),
    // Interview load per panelist (join users for display names).
    db
      .select({ name: users.name, value: count() })
      .from(interviewPanelists)
      .innerJoin(users, eq(users.id, interviewPanelists.userId))
      .where(eq(interviewPanelists.orgId, orgId))
      .groupBy(users.id, users.name)
      .orderBy(desc(count())),
    // Offer acceptance: accepted vs. offers actually EXTENDED to candidates. Draft/pending/approved
    // offers haven't reached the candidate yet, so they must not dilute the denominator.
    db
      .select({
        accepted: sql<number>`count(*) filter (where ${offers.status} = 'accepted')`.mapWith(Number),
        total: sql<number>`count(*) filter (where ${offers.status} in ('sent','accepted','declined','withdrawn'))`.mapWith(Number),
      })
      .from(offers)
      .where(eq(offers.orgId, orgId)),
    // Days from applied_on to the candidate's 'hired' stage_history row — basis for time-to-hire.
    db
      .select({
        hiredOn: candidateStageHistory.enteredOn,
        days: sql<number>`(${candidateStageHistory.enteredOn}::date - ${candidates.appliedOn}::date)`.mapWith(
          Number,
        ),
      })
      .from(candidateStageHistory)
      .innerJoin(candidates, eq(candidates.id, candidateStageHistory.candidateId))
      .where(
        and(
          eq(candidateStageHistory.orgId, orgId),
          eq(candidateStageHistory.stage, "hired"),
        ),
      )
      .orderBy(asc(candidateStageHistory.enteredOn)),
  ]);

  // Count by stage keyed for quick lookup.
  const countByStage = new Map(stageCounts.map((r) => [r.stage, Number(r.value)]));

  // Funnel: one bar per pipeline stage, in canonical order, coloured by stage.
  const funnel: FunnelStage[] = STAGE_ORDER.map((stage) => ({
    label: stageLabels[stage],
    value: countByStage.get(stage) ?? 0,
    color: stageColors[stage],
  }));

  // Source of hire: drop null/empty sources, label as-is.
  const sourceOfHire = sourceRows
    .filter((r) => r.source && r.source.trim().length > 0)
    .map((r) => ({ label: r.source as string, value: Number(r.value) }));

  // Interviewer load: { name, count } the BarList maps into { label, value }.
  const interviewerLoad = panelRows.map((r) => ({ name: r.name, count: Number(r.value) }));

  // Drop-off by stage: the proportion that did NOT advance from each step to the next,
  // expressed as a whole-number percentage. STAGE_ORDER is the canonical pipeline order.
  const dropOffByStage: { stage: string; rate: number }[] = [];
  for (let i = 0; i < STAGE_ORDER.length - 1; i++) {
    const from = STAGE_ORDER[i];
    const to = STAGE_ORDER[i + 1];
    const fromCount = countByStage.get(from) ?? 0;
    const toCount = countByStage.get(to) ?? 0;
    const rate = fromCount > 0 ? Math.round((1 - toCount / fromCount) * 100) : 0;
    dropOffByStage.push({ stage: `${stageLabels[from]} → ${stageLabels[to]}`, rate });
  }

  const offerAcceptance = {
    accepted: offerRow[0]?.accepted ?? 0,
    total: offerRow[0]?.total ?? 0,
  };
  const offerAcceptanceRate =
    offerAcceptance.total > 0
      ? Math.round((offerAcceptance.accepted / offerAcceptance.total) * 100)
      : 0;

  // Time to hire: median days, bucketed into ten equal slices of the hires (oldest → newest)
  // so the sparkline reads left-to-right over time. Empty when nothing has been hired yet.
  const durations = hireDurations.map((r) => r.days).filter((d) => Number.isFinite(d) && d >= 0);
  const timeToHireSeries = bucketMedians(durations, 10);
  const medianDaysToHire = durations.length > 0 ? median(durations) : 0;

  // Delta vs the prior period: compare the median of the first half of hires to the second
  // half. Negative means faster (down) — the headline copy reads "faster" on a negative delta.
  let deltaPct = 0;
  if (durations.length >= 2) {
    const mid = Math.floor(durations.length / 2);
    const earlier = median(durations.slice(0, mid));
    const later = median(durations.slice(mid));
    if (earlier > 0) deltaPct = Math.round(((later - earlier) / earlier) * 100);
  }

  return {
    funnel,
    timeToHireSeries,
    offerAcceptance,
    sourceOfHire,
    interviewerLoad,
    dropOffByStage,
    reportHeadline: { medianDaysToHire, deltaPct, offerAcceptanceRate },
  };
}

/** Median of a numeric list (0 when empty). */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

/**
 * Split an ordered series into `slices` contiguous buckets and return each bucket's median.
 * Returns an empty array when there's no data so the sparkline renders nothing yet.
 */
function bucketMedians(values: number[], slices: number): number[] {
  if (values.length === 0) return [];
  const out: number[] = [];
  const size = values.length / slices;
  for (let i = 0; i < slices; i++) {
    const start = Math.floor(i * size);
    const end = Math.floor((i + 1) * size);
    const bucket = values.slice(start, end);
    if (bucket.length > 0) out.push(median(bucket));
  }
  return out;
}
