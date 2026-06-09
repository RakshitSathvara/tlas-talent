import { cn } from "@/lib/utils";

// Smallcaps eyebrow that replaces the H2/H3 pattern (design-system.md §6.3).
export function SectionLabel({
  children,
  right,
  className,
}: {
  children: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <h2 className="smallcaps text-[11px] text-ink-soft">{children}</h2>
      {right}
    </div>
  );
}
