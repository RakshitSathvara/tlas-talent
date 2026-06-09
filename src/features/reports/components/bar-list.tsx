"use client";

import { useEffect, useState } from "react";
import { fillTransition } from "@/lib/motion";
import { c } from "@/lib/tokens";

/**
 * Horizontal bar chart for a flat list of { label, value }. Bars grow from zero on
 * mount (same fill transition the funnel and progress bars use). Values right-align
 * in mono so the column reads like a ledger.
 */
export function BarList({
  data,
  color = c.ink,
  suffix = "",
}: {
  data: { label: string; value: number }[];
  color?: string;
  suffix?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-3">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-24 flex-shrink-0 truncate text-[12px] text-ink-soft">{d.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full"
              style={{
                width: mounted ? `${(d.value / max) * 100}%` : "0%",
                backgroundColor: color,
                transition: fillTransition,
              }}
            />
          </div>
          <span className="w-12 flex-shrink-0 text-right font-mono text-[12px] text-ink">
            {d.value}
            {suffix}
          </span>
        </div>
      ))}
    </div>
  );
}
