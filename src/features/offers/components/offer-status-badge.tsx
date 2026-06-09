import type { OfferStatus } from "@/types/enums";
import { Badge } from "@/components/ui/badge";

type Tone = "accent" | "neutral" | "muted";

// Maps an offer's lifecycle state to the right Badge tone + label (design-system.md §5.4).
const map: Record<OfferStatus, { tone: Tone; label: string }> = {
  draft: { tone: "muted", label: "Draft" },
  pending_approval: { tone: "accent", label: "Pending approval" },
  approved: { tone: "neutral", label: "Approved" },
  sent: { tone: "neutral", label: "Sent" },
  accepted: { tone: "accent", label: "Accepted" },
  declined: { tone: "muted", label: "Declined" },
  withdrawn: { tone: "muted", label: "Withdrawn" },
};

export function OfferStatusBadge({ status }: { status: OfferStatus }) {
  const { tone, label } = map[status];
  return <Badge tone={tone}>{label}</Badge>;
}
