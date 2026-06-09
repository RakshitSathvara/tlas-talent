import { Briefcase, FileText } from "lucide-react";
import type { Approval } from "@/types/domain";
import { cn } from "@/lib/utils";
import { ApprovalActions } from "./approval-actions";

// Full-width approval card (design-system.md §7.2). One per item awaiting the leader.
export function ApprovalCard({ approval, delay = 0 }: { approval: Approval; delay?: number }) {
  const isOffer = approval.type === "offer";
  const reviewHref = isOffer
    ? `/offers/${approval.entityId}`
    : `/requisitions/${approval.entityId}`;

  return (
    <div
      className="anim-up lift relative overflow-hidden rounded-xl border border-line bg-surface p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border",
            isOffer
              ? "border-accent-soft bg-accent-soft text-accent-ink"
              : "border-line bg-surface text-ink-soft",
          )}
        >
          {isOffer ? <FileText size={16} /> : <Briefcase size={16} />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-baseline gap-2">
            <span className={cn("smallcaps text-[10px]", isOffer ? "text-accent" : "text-ink-soft")}>
              {isOffer ? "Offer approval" : "Requisition"}
            </span>
            {approval.amount && (
              <span className="rounded bg-line px-1.5 py-0.5 font-mono text-[11px] text-ink">
                {approval.amount}
              </span>
            )}
          </div>
          <h3 className="mb-1 font-serif text-[22px] font-normal leading-tight text-ink">
            {approval.title}
          </h3>
          <p className="text-[13px] text-ink-soft">
            {approval.subtitle} · raised by {approval.requester}
          </p>
        </div>
        <ApprovalActions reviewHref={reviewHref} />
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-ink-softer">
        <span>Raised {approval.raised}</span>
        <span className="flex items-center gap-1">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-accent" />
          Awaiting you
        </span>
      </div>
    </div>
  );
}
