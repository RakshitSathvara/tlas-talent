"use client";

import { cn } from "@/lib/utils";

/** Ghost icon button for header chrome (design-system.md §5.2). */
export function IconButton({
  children,
  hasDot = false,
  className,
  ...rest
}: {
  children: React.ReactNode;
  hasDot?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-full text-ink-soft transition-colors duration-200 hover:bg-black/[0.04]",
        className,
      )}
      {...rest}
    >
      {children}
      {hasDot && (
        <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
      )}
    </button>
  );
}
