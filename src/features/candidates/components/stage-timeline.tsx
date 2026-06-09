import type { StageEvent } from "@/types/domain";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate } from "@/lib/format";
import { c, stageColor, stageLabels } from "@/lib/tokens";

/**
 * Vertical stage timeline (design-system.md §6.7). Nodes are connected by a hairline;
 * the current stage reads in ink, past stages in their stage colour.
 */
export function StageTimeline({ events }: { events: StageEvent[] }) {
  if (events.length === 0) {
    return <EmptyState>No stage history recorded yet.</EmptyState>;
  }

  return (
    <ol className="relative flex flex-col">
      <span
        className="absolute bottom-2 left-[5px] top-2 w-px"
        style={{ backgroundColor: c.border }}
        aria-hidden
      />
      {events.map((event, i) => {
        const dotColor = event.current ? c.ink : stageColor(event.stage);
        return (
          <li
            key={`${event.stage}-${i}`}
            className="relative flex gap-4 pb-6 pl-0 last:pb-0"
          >
            <span
              className="relative z-10 mt-[3px] h-[11px] w-[11px] flex-shrink-0 rounded-full"
              style={{
                backgroundColor: event.current ? dotColor : c.surface,
                border: `2px solid ${dotColor}`,
              }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="smallcaps text-[11px]"
                  style={{ color: event.current ? c.ink : c.inkSoft }}
                >
                  {stageLabels[event.stage]}
                </span>
                <time className="font-mono text-[11px] text-ink-softer">
                  {formatDate(event.enteredOn)}
                </time>
              </div>
              {event.note && (
                <p className="mt-1 text-[12.5px] text-ink-soft">{event.note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
