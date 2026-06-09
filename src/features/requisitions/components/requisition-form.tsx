"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import type { Requisition } from "@/types/domain";
import type { Priority } from "@/types/enums";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/chip";
import { SectionLabel } from "@/components/layout/section-label";
import { cn } from "@/lib/utils";
import { approvalChains } from "@/lib/mock/pipeline-config";
import { createRequisition, editRequisition } from "@/features/requisitions/actions";

const STEPS = ["Role details", "Headcount & band", "Approval routing"];

const priorities: { key: Priority; label: string }[] = [
  { key: "high", label: "High" },
  { key: "medium", label: "Medium" },
  { key: "low", label: "Low" },
];

/**
 * Loosely match a free-text band to a configured approval chain by reading any
 * lakh figures out of the band string. Falls back to the middle chain.
 */
function chainForBand(band: string): string[] {
  const numbers = band.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  const ceiling = numbers.length ? Math.max(...numbers) : 0;

  const middle = approvalChains[1]?.chain ?? approvalChains[0]?.chain ?? [];
  if (!ceiling) return middle;

  if (ceiling > 35) return approvalChains[2]?.chain ?? middle;
  if (ceiling > 25) return approvalChains[1]?.chain ?? middle;
  return approvalChains[0]?.chain ?? middle;
}

export function RequisitionForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Requisition;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [team, setTeam] = useState(initial?.team ?? "");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [openings, setOpenings] = useState(String(initial?.openings ?? 1));
  const [band, setBand] = useState(initial?.band ?? "");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const chain = chainForBand(band);
  const isLast = step === STEPS.length - 1;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLast) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      return;
    }
    setError(null);

    // The form captures a free-text band ("₹24–30L"); derive numeric min/max (in rupees).
    const nums = band.match(/\d+(?:\.\d+)?/g)?.map(Number) ?? [];
    const bandMin = (nums.length ? Math.min(...nums) : 0) * 100_000;
    const bandMax = (nums.length ? Math.max(...nums) : 0) * 100_000;
    const payload = {
      title,
      team,
      location,
      openings: Number(openings) || 1,
      priority,
      band,
      bandMin,
      bandMax,
      description,
    };

    startTransition(async () => {
      const res =
        mode === "edit" && initial
          ? await editRequisition({ id: initial.id, ...payload })
          : await createRequisition(payload);
      if (res.ok) {
        router.push(
          mode === "edit" && initial ? `/requisitions/${initial.id}` : "/requisitions",
        );
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-3">
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <div key={label} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                className="flex items-center gap-2"
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px]",
                    current && "bg-ink text-surface",
                    done && "bg-stage-offer text-surface",
                    !current && !done && "border border-line text-ink-softer",
                  )}
                >
                  {done ? <Check size={12} /> : i + 1}
                </span>
                <span
                  className={cn(
                    "text-[12px]",
                    current ? "font-medium text-ink" : "text-ink-softer",
                  )}
                >
                  {label}
                </span>
              </button>
              {i < STEPS.length - 1 && <span className="h-px w-6 bg-line" />}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Role details */}
      {step === 0 && (
        <div className="anim-in space-y-5">
          <Field label="Role title">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Senior React Developer"
            />
          </Field>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Team">
              <Input
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                placeholder="Platform"
              />
            </Field>
            <Field label="Location">
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ahmedabad"
              />
            </Field>
          </div>
          <Field label="Description">
            <Textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this person will own, and who thrives in the role."
            />
          </Field>
        </div>
      )}

      {/* Step 2 — Headcount & band */}
      {step === 1 && (
        <div className="anim-in space-y-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Openings">
              <Input
                type="number"
                min={1}
                value={openings}
                onChange={(e) => setOpenings(e.target.value)}
                placeholder="1"
              />
            </Field>
            <Field label="Compensation band">
              <Input
                value={band}
                onChange={(e) => setBand(e.target.value)}
                placeholder="₹24–30L"
              />
            </Field>
          </div>
          <Field label="Priority">
            <div className="flex flex-wrap gap-2">
              {priorities.map((p) => (
                <FilterChip
                  key={p.key}
                  active={priority === p.key}
                  onClick={() => setPriority(p.key)}
                >
                  {p.label}
                </FilterChip>
              ))}
            </div>
          </Field>
        </div>
      )}

      {/* Step 3 — Approval routing preview */}
      {step === 2 && (
        <div className="anim-in">
          <SectionLabel>Approval routing</SectionLabel>
          <p className="mb-5 max-w-prose text-[13.5px] text-ink-soft">
            Based on the {band || "compensation"} band, this requisition routes through the
            following sign-offs before it opens.
          </p>
          <div className="rounded-xl border border-line bg-surface p-5">
            <ol className="space-y-3">
              {chain.map((approver, i) => (
                <li key={approver} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-ink-softer">
                    <Clock size={12} />
                  </span>
                  <span className="font-mono text-[11px] text-ink-softer">{i + 1}</span>
                  <span className="text-[13.5px] text-ink">{approver}</span>
                  <span className="smallcaps ml-auto text-[10px] text-ink-softer">pending</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-6 text-[12.5px] text-accent" role="alert">
          {error}
        </p>
      )}

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          onClick={() => setStep((s) => Math.max(s - 1, 0))}
          disabled={step === 0 || pending}
        >
          Back
        </Button>
        <Button type="submit" variant="primary" disabled={pending}>
          {isLast
            ? pending
              ? "Submitting…"
              : mode === "edit"
                ? "Save changes"
                : "Submit for approval"
            : "Next"}
        </Button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="smallcaps mb-2 block text-[10px] text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
