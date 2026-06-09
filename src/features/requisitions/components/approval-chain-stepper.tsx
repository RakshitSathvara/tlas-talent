import { Check, X, Clock } from "lucide-react";
import type { ApprovalStep } from "@/types/domain";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Horizontal approval-chain stepper (design-system.md §7.4). Read-only — it visualises
 * the chain (TL → HR → CEO) with each step's state and timestamp.
 */
export function ApprovalChainStepper({ steps }: { steps: ApprovalStep[] }) {
  return (
    <div className="flex items-center">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <div key={i} className={cn("flex items-center", !last && "flex-1")}>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border",
                  step.state === "approved" && "border-stage-offer bg-stage-offer text-surface",
                  step.state === "rejected" && "border-accent bg-accent text-surface",
                  step.state === "pending" && "border-line bg-surface text-ink-softer",
                )}
              >
                {step.state === "approved" && <Check size={14} />}
                {step.state === "rejected" && <X size={14} />}
                {step.state === "pending" && <Clock size={13} />}
              </div>
              <div>
                <div className="smallcaps text-[10px] text-ink-soft">{step.role}</div>
                <div className="text-[11px] text-ink">{step.name}</div>
                {step.actedOn && (
                  <div className="font-mono text-[10px] text-ink-softer">
                    {formatDate(step.actedOn)}
                  </div>
                )}
                {!step.actedOn && step.state === "pending" && (
                  <div className="font-mono text-[10px] text-ink-softer">awaiting</div>
                )}
              </div>
            </div>
            {!last && (
              <div
                className={cn(
                  "mx-2 mb-8 h-px flex-1",
                  step.state === "approved" ? "bg-stage-offer" : "bg-line",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
