"use client";

import { useEffect, useState } from "react";

/**
 * RAF count-up over ~900ms, ease-out cubic (design-system.md §4.2). Snaps to the final
 * value immediately when the user has asked for reduced motion (§8).
 */
export function useCountUp(value: number, delay = 0, duration = 900): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setDisplay(value);
      return;
    }
    let raf = 0;
    let start = 0;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const id = setTimeout(() => {
      raf = requestAnimationFrame(tick);
    }, delay);
    return () => {
      clearTimeout(id);
      cancelAnimationFrame(raf);
    };
  }, [value, delay, duration]);

  return display;
}
