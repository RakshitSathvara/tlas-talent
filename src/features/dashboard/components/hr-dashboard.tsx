"use client";

import { useState } from "react";
import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { StatCard } from "@/components/data/stat-card";
import { FilterChip } from "@/components/ui/chip";
import { PipelineBoard } from "@/features/pipeline/components/pipeline-board";
import { ActivityFeed } from "./activity-feed";
import { NeedsAttention } from "./needs-attention";
import { useRealtimeRefresh } from "@/hooks/use-realtime-refresh";
import type { HrDashboardData } from "@/features/dashboard/queries";

export function HRDashboard({ data }: { data: HrDashboardData }) {
  // Live activity feed: refresh the RSC data when an org activity row changes (RLS scopes the
  // stream to this org). The approvals queue could opt in the same way (table:'approval_requests').
  useRealtimeRefresh({ table: "activities" });

  const teamOf = (id: string) => data.reqTeams.find((r) => r.requisitionId === id)?.team;
  const teams = Array.from(
    new Set(
      data.candidates.map((cd) => teamOf(cd.requisitionId)).filter((t): t is string => Boolean(t)),
    ),
  );
  const [team, setTeam] = useState<string | null>(null);
  const shown = team
    ? data.candidates.filter((cd) => teamOf(cd.requisitionId) === team)
    : data.candidates;

  return (
    <>
      <PageHeading
        eyebrow="Hiring desk"
        title="The pipeline, this morning."
        description="Eighty-seven candidates across four open roles. Two interviews start in the next hour, three offers await leadership sign-off."
      />

      <div className="mb-12 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open requisitions" value={data.stats.openRequisitions} delta="+1" deltaPositive eyebrow="this month" delay={60} />
        <StatCard label="Active candidates" value={data.stats.activeCandidates} delta="+12" deltaPositive eyebrow="this week" delay={120} />
        <StatCard label="Interviews scheduled" value={data.stats.interviewsScheduled} delta={`${data.stats.interviewsToday} today`} eyebrow="this week" delay={180} />
        <StatCard label="Offers pending" value={data.stats.offersPending} delta="awaiting CEO" muted eyebrow="approval" delay={240} />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="anim-up" style={{ animationDelay: "300ms" }}>
          <SectionLabel
            right={
              <div className="flex items-center gap-2">
                <FilterChip active={team === null} onClick={() => setTeam(null)}>
                  All roles
                </FilterChip>
                {teams.map((t) => (
                  <FilterChip key={t} active={team === t} onClick={() => setTeam(t)}>
                    {t}
                  </FilterChip>
                ))}
              </div>
            }
          >
            Pipeline
          </SectionLabel>
          <PipelineBoard candidates={shown} />
        </div>

        <aside className="anim-up space-y-6" style={{ animationDelay: "380ms" }}>
          <div>
            <SectionLabel>Activity</SectionLabel>
            <ActivityFeed items={data.activity} />
          </div>
          <NeedsAttention items={data.needsAttention} />
        </aside>
      </div>
    </>
  );
}
