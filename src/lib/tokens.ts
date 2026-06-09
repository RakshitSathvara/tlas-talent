import type { StageKey } from "@/types/enums";

/**
 * The design-system colour palette as an imperative object (design-system.md §2.1).
 * Use Tailwind utilities (`bg-surface`, `text-ink`) for static colour; reach for `c`
 * only where the design system asks for an inline style — chiefly dynamic stage
 * colour computed at runtime. Keeping both in sync: see globals.css `@theme`.
 */
export const c = {
  bg: "#F2EEE3",
  surface: "#FBF9F2",
  white: "#FFFFFF",
  ink: "#1A1816",
  inkSoft: "#6E6A60",
  inkSofter: "#A19D90",
  border: "#E2DCCB",
  borderStrong: "#C9C2AE",
  accent: "#B8462A",
  accentInk: "#7A2D17",
  accentSoft: "#F0DDCF",
} as const;

/** Stage colours are a separate scale — used only to identify pipeline stages. */
export const stageColors: Record<StageKey, string> = {
  sourced: "#8B8579",
  hr_review: "#C8954E",
  tl_review: "#5A6F8C",
  interview: "#2D5266",
  offer: "#3A6B45",
  hired: "#1F4429",
  rejected: "#9B6B63",
};

export const stageColor = (stage: StageKey): string => stageColors[stage];

/** Human labels for stages, in pipeline order. `rejected` is terminal, off-board. */
export const STAGE_ORDER: StageKey[] = [
  "sourced",
  "hr_review",
  "tl_review",
  "interview",
  "offer",
  "hired",
];

export const stageLabels: Record<StageKey, string> = {
  sourced: "Sourced",
  hr_review: "HR Review",
  tl_review: "TL Review",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};
