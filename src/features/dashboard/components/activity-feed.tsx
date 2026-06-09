import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Activity } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ActivityFeed({ items, limit = 5 }: { items: Activity[]; limit?: number }) {
  const shown = items.slice(0, limit);
  return (
    <Card padded={false} className="overflow-hidden">
      <ul>
        {shown.map((a, i) => (
          <li
            key={a.id}
            className={cn("flex items-start gap-3 px-5 py-4", i !== 0 && "border-t border-line")}
          >
            <span
              className={cn(
                "mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full",
                i === 0 ? "bg-accent" : "bg-ink-softer",
              )}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-snug text-ink">
                <span className="font-medium">{a.who}</span>{" "}
                <span className="text-ink-soft">{a.what}</span> {a.target}
              </p>
              <p className="mt-1 font-mono text-[11px] text-ink-softer">{a.when} ago</p>
            </div>
          </li>
        ))}
      </ul>
      <Link
        href="/notifications"
        className="flex items-center justify-between border-t border-line px-5 py-3 text-[12px] text-ink-soft"
      >
        <span>This week</span>
        <span className="flex items-center gap-1 text-ink hover:underline">
          See all <ChevronRight size={12} />
        </span>
      </Link>
    </Card>
  );
}
