"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Clock } from "lucide-react";
import type { Candidate } from "@/types/domain";
import type { StageKey } from "@/types/enums";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/chip";
import { EmptyState } from "@/components/data/empty-state";
import { STAGE_ORDER, stageColor, stageLabels } from "@/lib/tokens";
import { cn } from "@/lib/utils";

type StageFilter = StageKey | "all";

/**
 * The candidate directory (design-system.md §6.6). A search field over name/role/location,
 * stage filter chips, and a column of card rows that link through to each profile.
 */
export function CandidateDirectory({ candidates }: { candidates: Candidate[] }) {
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<StageFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      if (stage !== "all" && candidate.stage !== stage) return false;
      if (!q) return true;
      return (
        candidate.name.toLowerCase().includes(q) ||
        candidate.role.toLowerCase().includes(q) ||
        candidate.location.toLowerCase().includes(q)
      );
    });
  }, [candidates, query, stage]);

  return (
    <div className="anim-up">
      <div className="mb-5 max-w-md">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name, role or location"
          aria-label="Search candidates"
        />
      </div>

      <div className="mb-7 flex flex-wrap items-center gap-2">
        <FilterChip active={stage === "all"} onClick={() => setStage("all")}>
          All
        </FilterChip>
        {STAGE_ORDER.map((key) => (
          <FilterChip key={key} active={stage === key} onClick={() => setStage(key)}>
            {stageLabels[key]}
          </FilterChip>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No candidates match that search yet.</EmptyState>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filtered.map((candidate) => (
            <Link
              key={candidate.id}
              href={`/candidates/${candidate.id}`}
              className="lift flex items-center gap-4 rounded-xl border border-line bg-surface p-4"
            >
              <Avatar initials={candidate.initials} tint={candidate.tint} size={36} />

              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-medium leading-tight text-ink">
                  {candidate.name}
                </div>
                <div className="mt-0.5 truncate text-[12.5px] text-ink-soft">{candidate.role}</div>
              </div>

              <span className="hidden items-center gap-1.5 text-[11.5px] text-ink-soft sm:flex">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: stageColor(candidate.stage) }}
                />
                {stageLabels[candidate.stage]}
              </span>

              <span className="hidden w-40 text-right font-mono text-[11px] text-ink-softer md:block">
                {candidate.experience} · {candidate.location}
              </span>

              <span
                className={cn(
                  "flex w-16 flex-shrink-0 items-center justify-end gap-1 font-mono text-[11px]",
                  candidate.daysInStage > 3 ? "text-accent" : "text-ink-softer",
                )}
              >
                <Clock size={11} />
                {candidate.daysInStage}d
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
