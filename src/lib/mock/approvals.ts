import type { Approval } from "@/types/domain";

// The unified leadership queue: requisitions + offers awaiting this leader.
export const approvals: Approval[] = [
  {
    id: "a1",
    type: "requisition",
    title: "Engineering Manager",
    subtitle: "Platform · 1 opening",
    requester: "Priya Shah",
    raised: "2h ago",
    entityId: "r5",
  },
  {
    id: "a2",
    type: "offer",
    title: "Devansh Shah",
    subtitle: "Senior React Developer",
    requester: "Priya Shah",
    raised: "4h ago",
    amount: "₹28.5L",
    entityId: "o1",
  },
  {
    id: "a3",
    type: "requisition",
    title: "Data Analyst",
    subtitle: "Analytics · 2 openings",
    requester: "Karan Joshi",
    raised: "1d ago",
    entityId: "r6",
  },
];
