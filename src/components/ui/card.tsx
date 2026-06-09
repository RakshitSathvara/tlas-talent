import { cn } from "@/lib/utils";

/**
 * The base surface (design-system.md §5.1). Sits on cream with a 1px border and no
 * resting shadow. `interactive` adds the lift-on-hover treatment; `accent` turns it
 * into a callout (accent-soft background).
 */
export function Card({
  children,
  className,
  padded = true,
  interactive = false,
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  padded?: boolean;
  interactive?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border",
        padded && "p-5",
        interactive && "lift cursor-pointer",
        accent ? "border-accent-soft bg-accent-soft text-accent-ink" : "border-line bg-surface",
        className,
      )}
    >
      {children}
    </div>
  );
}
