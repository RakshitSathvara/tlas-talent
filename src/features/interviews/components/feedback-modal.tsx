"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { Interview } from "@/types/domain";
import type { Recommendation } from "@/types/enums";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/features/feedback/actions";

const RECOMMENDATIONS: { key: Recommendation; label: string }[] = [
  { key: "strong_yes", label: "Strong yes" },
  { key: "yes", label: "Yes" },
  { key: "maybe", label: "Maybe" },
  { key: "no", label: "No" },
];

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[14px] text-ink">{label}</span>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const on = n <= value;
          return (
            <button
              key={n}
              type="button"
              aria-label={`${label}: ${n} of 5`}
              onClick={() => onChange(n)}
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border transition-all",
                on ? "border-ink bg-ink text-surface" : "border-line text-ink-softer",
              )}
            >
              <Star size={12} fill={on ? "#FBF9F2" : "transparent"} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Parse the round number out of the domain "Round N" string, defaulting to 1. */
function roundNumber(round: string): number {
  const n = round.match(/\d+/)?.[0];
  return n ? Number(n) : 1;
}

/**
 * Structured feedback that gates stage advancement (design-system.md §7.3). Four ratings,
 * a recommendation, notes. Submits through the feedback action — the service refuses a
 * duplicate and flips the interview to 'completed' once the panel has all filed.
 */
export function FeedbackModal({
  interview,
  open,
  onClose,
}: {
  interview: Interview;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [technical, setTechnical] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [roleFit, setRoleFit] = useState(0);
  const [cultural, setCultural] = useState(0);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    if (!rec) {
      setError("Pick a recommendation before submitting.");
      return;
    }
    if (!technical || !communication || !roleFit || !cultural) {
      setError("Rate all four dimensions before submitting.");
      return;
    }

    startTransition(async () => {
      const res = await submitFeedback({
        interviewId: interview.id,
        round: roundNumber(interview.round),
        ratings: { technical, communication, roleFit, cultural },
        recommendation: rec,
        notes: notes.trim() || undefined,
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-7">
        <div className="smallcaps mb-2 text-[10px] text-accent">
          Interview feedback · {interview.round}
        </div>
        <h2 className="font-serif text-[28px] font-normal leading-tight text-ink">
          {interview.candidate}
        </h2>
        <p className="mt-1 text-[13px] text-ink-soft">{interview.role}</p>
      </div>

      <div className="space-y-5 px-7 pb-2">
        <RatingRow label="Technical depth" value={technical} onChange={setTechnical} />
        <RatingRow label="Communication" value={communication} onChange={setCommunication} />
        <RatingRow label="Role fit" value={roleFit} onChange={setRoleFit} />
        <RatingRow label="Cultural alignment" value={cultural} onChange={setCultural} />
      </div>

      <div className="px-7 pb-2 pt-4">
        <div className="smallcaps mb-2 text-[10px] text-ink-softer">Recommendation</div>
        <div className="flex flex-wrap gap-2">
          {RECOMMENDATIONS.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRec(r.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
                rec === r.key
                  ? "border-ink bg-ink text-surface"
                  : "border-line text-ink hover:border-line-strong",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-7 pb-5 pt-4">
        <div className="smallcaps mb-2 text-[10px] text-ink-softer">Notes</div>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What stood out? Any concerns?"
          style={{ minHeight: 100 }}
        />
      </div>

      {error && (
        <p className="px-7 pb-2 text-[12.5px] text-accent" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between border-t border-line px-7 py-4">
        <button
          onClick={onClose}
          disabled={pending}
          className="text-[13px] text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
        <Button variant="primary" onClick={handleSubmit} disabled={pending}>
          {pending ? "Submitting…" : "Submit feedback"}
        </Button>
      </div>
    </Modal>
  );
}
