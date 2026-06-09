"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Candidate } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";

type Decision = "advanced" | "rejected";

/**
 * Detail-header actions. With no wired backend, Advance/Reject resolve optimistically to
 * inline confirmation (design-system.md §4 — one gesture). HR/admin only; others view.
 */
export function CandidateActionBar({ candidate }: { candidate: Candidate }) {
  const { can } = useRole();
  const [decided, setDecided] = useState<Decision | null>(null);
  const first = candidate.name.split(" ")[0];

  if (decided) {
    return (
      <span className="flex items-center gap-1.5 smallcaps text-[11px] text-ink-soft">
        {decided === "advanced" ? <Check size={13} /> : <X size={13} />}
        {decided === "advanced" ? `${first} advanced` : `${first} rejected`}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {can("manageCandidates") && (
        <>
          <Button variant="primary" onClick={() => setDecided("advanced")}>
            Advance
          </Button>
          <Button variant="secondary" onClick={() => setDecided("rejected")}>
            Reject
          </Button>
        </>
      )}
      <Button variant="secondary" href="/interviews">
        Schedule
      </Button>
    </div>
  );
}
