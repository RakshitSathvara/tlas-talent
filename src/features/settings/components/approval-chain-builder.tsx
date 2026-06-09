import { Fragment } from "react";
import { Card } from "@/components/ui/card";
import type { ApprovalChainConfig } from "@/types/domain";

/** Read-mostly view of the approval routes: one band per row, its chain as steps. */
export function ApprovalChainBuilder({ chains }: { chains: ApprovalChainConfig[] }) {
  return (
    <div className="space-y-3">
      {chains.map((chain) => (
        <Card key={chain.band} className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="smallcaps mb-1 block text-[10px] text-ink-softer">Band</span>
            <p className="font-mono text-[14px] text-ink">{chain.band}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {chain.chain.map((step, i) => (
              <Fragment key={step}>
                {i > 0 && (
                  <span className="text-[13px] text-ink-softer" aria-hidden>
                    &rarr;
                  </span>
                )}
                <span className="rounded-full border border-line bg-paper px-3 py-1 text-[12px] font-medium text-ink-soft">
                  {step}
                </span>
              </Fragment>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
