"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { stageColor } from "@/lib/tokens";
import type { StageConfig } from "@/types/domain";
import type { Role } from "@/types/enums";

const roleLabels: Record<Role, string> = {
  hr: "HR",
  leadership: "Leadership",
  interviewer: "Interviewer",
  admin: "Admin",
};

function StageRow({ stage }: { stage: StageConfig }) {
  const [sla, setSla] = useState(stage.slaDays);

  return (
    <li className="flex items-center gap-4 py-4">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: stageColor(stage.key) }}
        aria-hidden
      />
      <span className="min-w-0 flex-1 text-[14px] text-ink">{stage.label}</span>

      <label className="flex shrink-0 items-center gap-2">
        <span className="smallcaps text-[10px] text-ink-softer">SLA</span>
        <span className="inline-flex items-center rounded-lg border border-line bg-paper pr-3 focus-within:border-ink">
          <input
            type="number"
            min={0}
            value={sla}
            onChange={(e) => setSla(Number(e.target.value))}
            className="w-14 bg-transparent py-2 pl-3 text-right font-mono text-[13px] text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-[12px] text-ink-softer">days</span>
        </span>
      </label>

      <div className="hidden w-32 shrink-0 text-right sm:block">
        <Badge tone="neutral">{roleLabels[stage.owner]}</Badge>
      </div>
    </li>
  );
}

/** Each pipeline stage with an editable SLA and the role that owns it. */
export function StageConfigList({ stages }: { stages: StageConfig[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {stages.map((s) => (
        <StageRow key={s.key} stage={s} />
      ))}
    </ul>
  );
}
