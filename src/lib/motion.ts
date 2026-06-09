// Shared animation class names + inline-style helpers (design-system.md §4).
// The keyframes themselves live in globals.css; these keep usage consistent.
import type { CSSProperties } from "react";

export const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

/** Staggered mount: child i fades up `base + i*step` ms after the page paints. */
export function stagger(index: number, base = 0, step = 70): CSSProperties {
  return { animationDelay: `${base + index * step}ms` };
}

/** Width transition used by progress bars + funnel fills (design-system.md §4.2). */
export const fillTransition = `width 800ms ${EASE}`;
