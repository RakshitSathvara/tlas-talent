import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Candidate } from "@/types/domain";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/data/empty-state";
import { stageColor, stageLabels } from "@/lib/tokens";

/**
 * Bespoke applicants table for a requisition. Each row is a Link to the candidate
 * with a hover lift; the stage is shown as a coloured dot + label.
 */
export function ApplicantTable({ candidates }: { candidates: Candidate[] }) {
  if (candidates.length === 0) {
    return <EmptyState>No applicants have entered the pipeline for this role yet.</EmptyState>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line px-4 py-2.5">
        <div className="smallcaps text-[10px] text-ink-softer">Candidate</div>
        <div className="smallcaps text-[10px] text-ink-softer">Stage</div>
        <div className="smallcaps text-right text-[10px] text-ink-softer">In stage</div>
        <div className="w-4" />
      </div>

      {candidates.map((cand) => (
        <Link
          key={cand.id}
          href={`/candidates/${cand.id}`}
          className="lift grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-b border-line px-4 py-3 last:border-b-0"
        >
          <div className="flex min-w-0 items-center gap-3">
            <Avatar initials={cand.initials} tint={cand.tint} size={32} />
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-medium leading-tight text-ink">
                {cand.name}
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-ink-soft">{cand.experience}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: stageColor(cand.stage) }}
            />
            <span className="text-[12px] text-ink-soft">{stageLabels[cand.stage]}</span>
          </div>

          <div className="text-right font-mono text-[11px] text-ink-soft">{cand.daysInStage}d</div>

          <ChevronRight size={15} className="text-ink-softer" />
        </Link>
      ))}
    </div>
  );
}
