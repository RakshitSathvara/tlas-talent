import type { FunnelStage } from "@/types/domain";
import { stageColors } from "@/lib/tokens";

export const funnel: FunnelStage[] = [
  { label: "Sourced", value: 320, color: stageColors.sourced },
  { label: "Reviewed", value: 145, color: stageColors.hr_review },
  { label: "Interview", value: 58, color: stageColors.interview },
  { label: "Offer", value: 14, color: stageColors.offer },
  { label: "Hired", value: 12, color: stageColors.hired },
];

/** Median days-to-hire over the last ten weeks (newest last) — the sparkline series. */
export const timeToHireSeries: number[] = [32, 28, 30, 27, 26, 24, 22, 24, 21, 24];

export const offerAcceptance = { accepted: 12, total: 14 };

export const sourceOfHire: { label: string; value: number }[] = [
  { label: "Referral", value: 38 },
  { label: "LinkedIn", value: 27 },
  { label: "Naukri", value: 14 },
  { label: "Inbound", value: 12 },
  { label: "Agency", value: 9 },
];

export const interviewerLoad: { name: string; count: number }[] = [
  { name: "Meghna Iyer", count: 9 },
  { name: "Dev Anand", count: 7 },
  { name: "Aarav Nair", count: 6 },
  { name: "Ishan Roy", count: 4 },
];

export const dropOffByStage: { stage: string; rate: number }[] = [
  { stage: "Sourced → HR", rate: 55 },
  { stage: "HR → TL", rate: 32 },
  { stage: "TL → Interview", rate: 28 },
  { stage: "Interview → Offer", rate: 24 },
  { stage: "Offer → Hired", rate: 14 },
];

export const reportHeadline = {
  medianDaysToHire: 24,
  deltaPct: -14,
  offerAcceptanceRate: 86,
};
