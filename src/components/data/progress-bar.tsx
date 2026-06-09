"use client";

import { useEffect, useState } from "react";
import { fillTransition } from "@/lib/motion";
import { c } from "@/lib/tokens";

/** Track + fill that animates to its width on mount (design-system.md §4.2). */
export function ProgressBar({
  value,
  color = c.ink,
  height = 6,
  className,
}: {
  /** 0–100. */
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(Math.max(0, Math.min(100, value))));
    return () => cancelAnimationFrame(id);
  }, [value]);

  return (
    <div
      className={className}
      style={{
        height,
        borderRadius: 9999,
        backgroundColor: c.border,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${width}%`,
          backgroundColor: color,
          borderRadius: 9999,
          transition: fillTransition,
        }}
      />
    </div>
  );
}
