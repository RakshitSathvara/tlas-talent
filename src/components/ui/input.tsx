"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

// Form input (design-system.md §5.6). Sits on white, focus turns the border ink.
export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-lg border border-line bg-paper p-3 text-[13.5px] text-ink outline-none",
          "placeholder:text-ink-softer focus:border-ink",
          className,
        )}
        {...props}
      />
    );
  },
);
