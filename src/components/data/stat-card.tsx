"use client";

import { ArrowUpRight } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

// Stat card (design-system.md §6.5). Fraunces number counts up on mount.
export function StatCard({
  label,
  value,
  delta,
  deltaPositive = false,
  muted = false,
  eyebrow,
  delay = 0,
}: {
  label: string;
  value: number;
  delta?: string;
  deltaPositive?: boolean;
  muted?: boolean;
  eyebrow?: string;
  delay?: number;
}) {
  const display = useCountUp(value, delay);
  return (
    <div
      className="anim-up relative overflow-hidden rounded-xl border border-line bg-surface p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="smallcaps mb-3 text-[10px] text-ink-softer">{label}</div>
      <div className="flex items-baseline gap-3">
        <div className="font-serif text-[42px] font-normal leading-none text-ink">{display}</div>
        {delta && (
          <div
            className={cn(
              "flex items-center gap-1 font-mono text-[12px]",
              muted ? "text-ink-softer" : deltaPositive ? "text-stage-offer" : "text-ink-soft",
            )}
          >
            {deltaPositive && <ArrowUpRight size={11} />}
            {delta}
          </div>
        )}
      </div>
      {eyebrow && <div className="mt-2 text-[11px] text-ink-softer">{eyebrow}</div>}
    </div>
  );
}
