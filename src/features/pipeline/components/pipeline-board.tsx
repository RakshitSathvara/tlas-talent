import type { Candidate } from "@/types/domain";
import { STAGE_ORDER, stageColor, stageLabels } from "@/lib/tokens";
import { stagger } from "@/lib/motion";
import { EmptyState } from "@/components/data/empty-state";
import { CandidateCard } from "./candidate-card";

/**
 * The six-column kanban (design-system.md §6.6). Columns grow as tall as needed; only
 * the row scrolls horizontally. Drag-to-advance is a mutation, so it's left out of this
 * static build — cards link through to the candidate instead.
 */
export function PipelineBoard({ candidates }: { candidates: Candidate[] }) {
  return (
    <div className="scroll-soft -mx-1 flex gap-3 overflow-x-auto px-1 pb-4">
      {STAGE_ORDER.map((stage, i) => {
        const items = candidates.filter((c) => c.stage === stage);
        return (
          <div key={stage} className="anim-up w-[240px] flex-shrink-0" style={stagger(i, 300, 60)}>
            <div className="mb-3 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: stageColor(stage) }}
                />
                <span className="text-[12px] font-medium text-ink">{stageLabels[stage]}</span>
              </div>
              <span className="font-mono text-[11px] text-ink-softer">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map((cand) => (
                <CandidateCard key={cand.id} candidate={cand} />
              ))}
              {items.length === 0 && <EmptyState>No one here yet.</EmptyState>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
