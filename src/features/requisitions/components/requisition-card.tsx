import Link from "next/link";
import type { Requisition } from "@/types/domain";
import { PriorityBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/data/progress-bar";
import { c } from "@/lib/tokens";

export function RequisitionCard({ req }: { req: Requisition }) {
  const progress = req.openings ? (req.filled / req.openings) * 100 : 0;
  const filled = req.status === "filled";
  return (
    <Link
      href={`/requisitions/${req.id}`}
      className="lift block rounded-xl border border-line bg-surface p-5"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-[18px] font-medium leading-tight text-ink">{req.title}</h3>
          <p className="mt-0.5 text-[12px] text-ink-soft">{req.team} team</p>
        </div>
        <PriorityBadge priority={req.priority} />
      </div>
      <div className="mb-3 flex items-end justify-between">
        <div>
          <div className="font-serif text-[24px] font-normal leading-none text-ink">
            {req.pipeline}
          </div>
          <div className="mt-1 text-[10.5px] text-ink-softer">in pipeline</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-[11px] text-ink-soft">
            {req.filled}/{req.openings} filled
          </div>
          <div className="mt-1 text-[10.5px] text-ink-softer">{req.daysOpen}d open</div>
        </div>
      </div>
      <ProgressBar value={Math.max(progress, 4)} color={filled ? c.accent : c.ink} height={4} />
    </Link>
  );
}
