import type { ApprovalChainConfig, StageConfig } from "@/types/domain";

// The stages, their SLAs, and the approval chains per band (frontend-architecture.md §12.5).
// In a wired backend the worker reads this to detect SLA breaches and route offers.
export const stageConfig: StageConfig[] = [
  { key: "sourced", label: "Sourced", slaDays: 2, owner: "hr" },
  { key: "hr_review", label: "HR Review", slaDays: 4, owner: "hr" },
  { key: "tl_review", label: "TL Review", slaDays: 3, owner: "leadership" },
  { key: "interview", label: "Interview", slaDays: 7, owner: "hr" },
  { key: "offer", label: "Offer", slaDays: 5, owner: "leadership" },
  { key: "hired", label: "Hired", slaDays: 0, owner: "hr" },
];

export const approvalChains: ApprovalChainConfig[] = [
  { band: "Up to ₹25L", chain: ["TL", "HR"] },
  { band: "₹25L–₹35L", chain: ["TL", "HR", "CEO"] },
  { band: "Above ₹35L", chain: ["TL", "HR", "CEO", "Board"] },
];
