"use client";

import { useState } from "react";
import type { Interview } from "@/types/domain";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./feedback-modal";

/**
 * The action that opens the structured feedback form for an interview. When the panel
 * still owes notes (status pending_feedback) it reads as an accent "Give feedback";
 * otherwise it's a quieter secondary "Add feedback".
 */
export function InterviewFeedbackTrigger({ interview }: { interview: Interview }) {
  const [open, setOpen] = useState(false);
  const pending = interview.status === "pending_feedback";

  return (
    <>
      <Button variant={pending ? "accent" : "secondary"} onClick={() => setOpen(true)}>
        {pending ? "Give feedback" : "Add feedback"}
      </Button>
      <FeedbackModal interview={interview} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
