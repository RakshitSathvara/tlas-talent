"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  key: string;
  label: string;
  count?: number;
}

/** Underlined tabs on a 1px divider (design-system.md §6.7). */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1 border-b border-line", className)}>
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "relative px-3 py-2.5 text-[13px] font-medium transition-colors",
              active ? "text-ink" : "text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 font-mono text-[10px] text-ink-softer">{t.count}</span>
            )}
            {active && <span className="absolute -bottom-px left-0 right-0 h-px bg-ink" />}
          </button>
        );
      })}
    </div>
  );
}
