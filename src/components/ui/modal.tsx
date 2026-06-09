"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { EASE } from "@/lib/motion";

/**
 * Modal shell (design-system.md §5.8). Ink-tinted blurred backdrop, surface content,
 * fade-up on open. Closes on backdrop click and Escape.
 */
export function Modal({
  open,
  onClose,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-sm"
      style={{ animation: "fadeIn 200ms ease-out both", backgroundColor: "rgba(26,24,22,0.4)" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-full max-w-[560px] overflow-hidden rounded-2xl border border-line bg-surface",
          className,
        )}
        style={{ animation: `fadeUp 280ms ${EASE} both` }}
      >
        {children}
      </div>
    </div>
  );
}
