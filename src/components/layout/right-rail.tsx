import { cn } from "@/lib/utils";

// The 320–360px right rail used on dashboards (design-system.md §6.4).
export function RightRail({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <aside className={cn("space-y-6", className)}>{children}</aside>;
}
