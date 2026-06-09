import { cn } from "@/lib/utils";
import type { Priority } from "@/types/enums";

type Tone = "accent" | "neutral" | "muted" | "mono";

/** Small status indicator (design-system.md §5.4). Smallcaps, 10px. */
export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const tones: Record<Tone, string> = {
    accent: "border-accent-soft bg-accent-soft text-accent-ink smallcaps",
    neutral: "border-line bg-surface text-ink-soft smallcaps",
    muted: "border-line bg-surface text-ink-softer smallcaps",
    mono: "border-line bg-line text-ink font-mono",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[10px] leading-none",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const map: Record<Priority, { tone: Tone; label: string }> = {
    high: { tone: "accent", label: "High" },
    medium: { tone: "neutral", label: "Medium" },
    low: { tone: "muted", label: "Low" },
  };
  const { tone, label } = map[priority];
  return <Badge tone={tone}>{label}</Badge>;
}
