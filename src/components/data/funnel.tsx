"use client";

import { useEffect, useState } from "react";
import type { FunnelStage } from "@/types/domain";
import { EASE } from "@/lib/motion";

// Funnel bars (design-system.md §6.5). Bars grow from 0 to their share on mount.
export function Funnel({ stages }: { stages: FunnelStage[] }) {
  const max = Math.max(...stages.map((s) => s.value));
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="space-y-2.5">
      {stages.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-16 flex-shrink-0 text-[11px] text-ink-soft">{s.label}</span>
          <div className="relative h-5 flex-1 overflow-hidden rounded bg-line">
            <div
              className="h-full rounded"
              style={{
                width: mounted ? `${(s.value / max) * 100}%` : "0%",
                backgroundColor: s.color,
                transition: `width 700ms ${EASE}`,
              }}
            />
          </div>
          <span className="w-8 text-right font-mono text-[11px] text-ink">{s.value}</span>
        </div>
      ))}
    </div>
  );
}
