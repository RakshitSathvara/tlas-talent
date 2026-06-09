import type { Feedback } from "@/types/domain";
import type { Recommendation } from "@/types/enums";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/data/empty-state";
import { formatDate } from "@/lib/format";

type BadgeTone = "accent" | "neutral" | "muted";

const recommendation: Record<Recommendation, { label: string; tone: BadgeTone }> = {
  strong_yes: { label: "Strong yes", tone: "accent" },
  yes: { label: "Yes", tone: "neutral" },
  maybe: { label: "Maybe", tone: "neutral" },
  no: { label: "No", tone: "muted" },
};

/** The panel's verdicts on a candidate (design-system.md §6.7). One row per filed note. */
export function FeedbackSummaryList({ items }: { items: Feedback[] }) {
  if (items.length === 0) {
    return <EmptyState>No interview feedback filed yet.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => {
        const rec = recommendation[item.recommendation];
        return (
          <article key={item.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-[14px] font-medium leading-tight text-ink">
                  {item.interviewer}
                </h3>
                <p className="mt-0.5 text-[12px] text-ink-soft">{item.round}</p>
              </div>
              <Badge tone={rec.tone}>{rec.label}</Badge>
            </div>

            <p className="mt-3 font-mono text-[11.5px] text-ink-soft">
              Tech {item.ratings.technical} · Comm {item.ratings.communication} · Fit{" "}
              {item.ratings.roleFit} · Culture {item.ratings.cultural}
            </p>

            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-soft">{item.notes}</p>

            <p className="mt-3 border-t border-line pt-2 font-mono text-[10.5px] text-ink-softer">
              Submitted {formatDate(item.submittedOn)}
            </p>
          </article>
        );
      })}
    </div>
  );
}
