import Link from "next/link";
import { Clock } from "lucide-react";
import type { Candidate } from "@/types/domain";
import { Avatar } from "@/components/ui/avatar";
import { stageColor } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// Pipeline candidate card with a 3px stage stripe (design-system.md §5.1, §6.6).
export function CandidateCard({ candidate }: { candidate: Candidate }) {
  return (
    <Link
      href={`/candidates/${candidate.id}`}
      className="lift relative block overflow-hidden rounded-xl border border-line bg-paper"
    >
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ backgroundColor: stageColor(candidate.stage) }}
      />
      <div className="p-3.5 pl-4">
        <div className="flex items-start gap-3">
          <Avatar initials={candidate.initials} tint={candidate.tint} size={32} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium leading-tight text-ink">
              {candidate.name}
            </div>
            <div className="mt-0.5 truncate text-[11.5px] text-ink-soft">{candidate.role}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
          <span className="font-mono text-[11px] text-ink-softer">
            {candidate.experience} · {candidate.location}
          </span>
          <span
            className={cn(
              "flex items-center gap-1 font-mono text-[10.5px]",
              candidate.daysInStage > 3 ? "text-accent" : "text-ink-softer",
            )}
          >
            <Clock size={10} />
            {candidate.daysInStage}d
          </span>
        </div>
      </div>
    </Link>
  );
}
