import type { Approval } from "@/types/domain";
import { SectionLabel } from "@/components/layout/section-label";
import { EmptyState } from "@/components/data/empty-state";
import { pluralize } from "@/lib/format";
import { ApprovalCard } from "./approval-card";

/**
 * The leadership queue, grouped by what's being approved (design-system.md §7.2).
 * Requisitions first, then offers. Cards stagger in. Empty when the desk is clear.
 */
export function ApprovalQueue({ approvals }: { approvals: Approval[] }) {
  if (approvals.length === 0) {
    return <EmptyState>Nothing needs your sign-off right now.</EmptyState>;
  }

  const requisitions = approvals.filter((a) => a.type === "requisition");
  const offers = approvals.filter((a) => a.type === "offer");

  const groups: { key: string; label: string; items: Approval[] }[] = [
    { key: "requisition", label: "Requisitions", items: requisitions },
    { key: "offer", label: "Offers", items: offers },
  ].filter((g) => g.items.length > 0);

  let index = 0;

  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <section key={group.key}>
          <SectionLabel
            right={
              <span className="font-mono text-[11px] text-ink-softer">
                {pluralize(group.items.length, "item")}
              </span>
            }
          >
            {group.label}
          </SectionLabel>
          <div className="space-y-3">
            {group.items.map((approval) => {
              const delay = 60 + index * 80;
              index += 1;
              return <ApprovalCard key={approval.id} approval={approval} delay={delay} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
