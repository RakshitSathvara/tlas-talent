"use client";

import { cn } from "@/lib/utils";

/** Filter chip (design-system.md §5.3). Active = ink fill; inactive = bordered. */
export function FilterChip({
  children,
  active = false,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-[12px] font-medium transition-colors duration-200",
        active
          ? "border-ink bg-ink text-surface"
          : "border-line bg-transparent text-ink-soft hover:border-line-strong",
      )}
    >
      {children}
    </button>
  );
}
