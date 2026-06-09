"use client";

import { useMemo, useState } from "react";
import type { Candidate } from "@/types/domain";
import { requisitions } from "@/lib/mock/requisitions";
import { FilterChip } from "@/components/ui/chip";
import { PipelineBoard } from "./pipeline-board";

/**
 * The board plus a team filter row. Teams are derived from the requisition behind each
 * candidate (candidate.requisitionId -> requisition.team), mirroring the HR dashboard.
 * Filtering happens client-side so the chips feel instant.
 */
export function PipelineView({ candidates }: { candidates: Candidate[] }) {
  const [team, setTeam] = useState<string>("all");

  // Map requisition -> team once, then collect the distinct teams that actually have candidates.
  const reqTeam = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of requisitions) m.set(r.id, r.team);
    return m;
  }, []);

  const teams = useMemo(() => {
    const set = new Set<string>();
    for (const c of candidates) {
      const t = reqTeam.get(c.requisitionId);
      if (t) set.add(t);
    }
    return Array.from(set).sort();
  }, [candidates, reqTeam]);

  const filtered = useMemo(() => {
    if (team === "all") return candidates;
    return candidates.filter((c) => reqTeam.get(c.requisitionId) === team);
  }, [candidates, reqTeam, team]);

  return (
    <div>
      <div className="anim-up mb-6 flex flex-wrap items-center gap-2">
        <FilterChip active={team === "all"} onClick={() => setTeam("all")}>
          All teams
        </FilterChip>
        {teams.map((t) => (
          <FilterChip key={t} active={team === t} onClick={() => setTeam(t)}>
            {t}
          </FilterChip>
        ))}
      </div>

      <PipelineBoard candidates={filtered} />
    </div>
  );
}
