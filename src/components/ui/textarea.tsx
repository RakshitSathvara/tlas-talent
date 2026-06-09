"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-none rounded-lg border border-line bg-paper p-3 text-[13.5px] text-ink outline-none",
        "placeholder:text-ink-softer focus:border-ink",
        className,
      )}
      {...props}
    />
  );
});
