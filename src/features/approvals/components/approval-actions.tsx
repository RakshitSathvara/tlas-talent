"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Review + Approve actions. With no wired backend, Approve/Reject resolve optimistically
 * to inline confirmation (design-system.md §4 — one gesture per interaction).
 */
export function ApprovalActions({ reviewHref }: { reviewHref: string }) {
  const [decided, setDecided] = useState<null | "approved" | "rejected">(null);

  if (decided) {
    return (
      <span className="flex items-center gap-1.5 smallcaps text-[11px] text-ink-soft">
        <Check size={13} /> {decided === "approved" ? "Approved" : "Rejected"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" href={reviewHref}>
        Review
      </Button>
      <Button variant="primary" onClick={() => setDecided("approved")}>
        Approve
      </Button>
    </div>
  );
}
