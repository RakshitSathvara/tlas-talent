import { cn } from "@/lib/utils";

// Editorial empty state (design-system.md §5.9): a sentence on a dashed surface. No icon.
export function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-line py-6 text-center text-[12px] text-ink-softer",
        className,
      )}
    >
      {children}
    </div>
  );
}
