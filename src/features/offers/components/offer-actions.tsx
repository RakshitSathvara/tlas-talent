"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import type { Offer } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { useRole } from "@/hooks/use-role";

type Resolution = "sent" | "withdrawn";

/**
 * Footer actions for an offer (design-system.md §4 — one gesture per interaction). With no
 * wired backend, Send / Withdraw resolve optimistically to inline confirmation. Only the
 * roles that can draft offers see the controls at all.
 */
export function OfferActions({ offer }: { offer: Offer }) {
  const { can } = useRole();
  const [resolved, setResolved] = useState<Resolution | null>(null);

  if (!can("draftOffer")) return null;

  if (resolved) {
    return (
      <div className="flex items-center gap-2 smallcaps text-[11px] text-ink-soft">
        {resolved === "sent" ? <Check size={14} /> : <X size={14} />}
        {resolved === "sent"
          ? `Offer sent to ${offer.candidate.split(" ")[0]}`
          : "Offer withdrawn"}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="primary" onClick={() => setResolved("sent")}>
        Send to candidate
      </Button>
      <Button variant="secondary" onClick={() => setResolved("withdrawn")}>
        Withdraw
      </Button>
    </div>
  );
}
