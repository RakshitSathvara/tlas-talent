import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { SectionLabel } from "@/components/layout/section-label";
import type { NeedsAttentionItem } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";

// SLA breaches (days-in-stage past the stage SLA) + stalled roles, derived in the query.
// The section hides itself entirely when there's nothing urgent (design-system.md §7.1).
export function NeedsAttention({ items }: { items: NeedsAttentionItem[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <SectionLabel>Needs attention</SectionLabel>
      <Card padded={false} className="overflow-hidden">
        {items.map((it, i) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex items-start gap-3 px-5 py-4 transition-colors hover:bg-black/[0.02]",
              i !== 0 && "border-t border-line",
            )}
          >
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent-ink">
              <TriangleAlert size={13} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium text-ink">{it.title}</div>
              <div className="mt-0.5 text-[11.5px] text-ink-soft">{it.note}</div>
            </div>
            <ChevronRight size={14} className="mt-0.5 flex-shrink-0 text-ink-softer" />
          </Link>
        ))}
      </Card>
    </div>
  );
}
