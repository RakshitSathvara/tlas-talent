"use client";

import { useState } from "react";
import { Clock, Video, MapPin } from "lucide-react";
import type { Interview } from "@/types/domain";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "./feedback-modal";
import { cn } from "@/lib/utils";

/**
 * Horizontal interview card (design-system.md §7.3). Today's cards get a stronger border
 * and an ink time chip. Pending-feedback cards swap Join for an accent "Give feedback".
 */
export function InterviewCard({
  interview,
  accent = false,
  delay = 0,
}: {
  interview: Interview;
  accent?: boolean;
  delay?: number;
}) {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const isPending = interview.status === "pending_feedback";
  const isVideo = interview.mode === "video";

  return (
    <>
      <div
        className={cn(
          "anim-up lift flex items-center gap-5 rounded-xl border bg-surface p-5",
          accent ? "border-line-strong" : "border-line",
        )}
        style={{ animationDelay: `${delay}ms` }}
      >
        <div
          className={cn(
            "w-20 flex-shrink-0 rounded-lg py-2 text-center",
            accent ? "bg-ink text-surface" : "border border-line text-ink",
          )}
        >
          <div className="font-serif text-[22px] font-normal leading-none">{interview.time}</div>
          <div className="smallcaps mt-1 text-[10px] opacity-75">{interview.date}</div>
        </div>

        <Avatar initials={interview.initials} tint={interview.tint} size={44} />

        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-medium leading-tight text-ink">{interview.candidate}</h3>
          <p className="mt-1 text-[12.5px] text-ink-soft">{interview.role}</p>
          <div className="mt-2 flex items-center gap-4 font-mono text-[11px] text-ink-softer">
            <span className="flex items-center gap-1">
              <Clock size={11} /> {interview.duration}
            </span>
            <span className="flex items-center gap-1">
              {isVideo ? <Video size={11} /> : <MapPin size={11} />}
              {isVideo ? "Video call" : "In-person"}
            </span>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {isPending ? (
            <Button variant="accent" onClick={() => setFeedbackOpen(true)}>
              Give feedback
            </Button>
          ) : (
            <>
              <Button variant="secondary" href={`/candidates/${interview.candidateId}`}>
                Brief
              </Button>
              <Button variant={accent ? "accent" : "primary"} href={`/interviews/${interview.id}`}>
                <Video size={13} /> Join
              </Button>
            </>
          )}
        </div>
      </div>

      <FeedbackModal
        interview={interview}
        open={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
      />
    </>
  );
}
