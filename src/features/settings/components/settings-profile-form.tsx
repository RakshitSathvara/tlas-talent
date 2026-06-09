"use client";

import { useState } from "react";
import type { User } from "@/types/domain";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/layout/section-label";
import { cn } from "@/lib/utils";

interface Prefs {
  approvals: boolean;
  interviews: boolean;
  digest: boolean;
}

const prefMeta: { key: keyof Prefs; label: string; hint: string }[] = [
  {
    key: "approvals",
    label: "Approvals waiting on me",
    hint: "When a requisition or offer needs your sign-off.",
  },
  {
    key: "interviews",
    label: "Interview & feedback nudges",
    hint: "Reminders for upcoming panels and overdue feedback.",
  },
  {
    key: "digest",
    label: "Weekly hiring digest",
    hint: "A Monday-morning roll-up of pipeline movement.",
  },
];

function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={cn(
        "relative h-6 w-10 shrink-0 rounded-full border transition-colors",
        on ? "border-ink bg-ink" : "border-line bg-paper",
      )}
    >
      <span
        className={cn(
          "absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all",
          on ? "left-[18px] bg-surface" : "left-1 bg-ink-softer",
        )}
      />
    </button>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="smallcaps mb-2 block text-[10px] text-ink-softer">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[12px] text-ink-softer">{hint}</span>}
    </label>
  );
}

export function SettingsProfileForm({ user }: { user: User }) {
  const [name, setName] = useState(user.name);
  const [title, setTitle] = useState(user.title);
  const [prefs, setPrefs] = useState<Prefs>({ approvals: true, interviews: true, digest: false });
  // The saved baseline lives in state so a Save actually clears the dirty flag.
  const [baseline, setBaseline] = useState({
    name: user.name,
    title: user.title,
    prefs: { approvals: true, interviews: true, digest: false } as Prefs,
  });
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== baseline.name ||
    title !== baseline.title ||
    prefs.approvals !== baseline.prefs.approvals ||
    prefs.interviews !== baseline.prefs.interviews ||
    prefs.digest !== baseline.prefs.digest;

  function discard() {
    setName(baseline.name);
    setTitle(baseline.title);
    setPrefs(baseline.prefs);
    setSaved(false);
  }

  function save() {
    // No backend — snapshot the current values as the new baseline so the bar falls away.
    setBaseline({ name, title, prefs });
    setSaved(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save();
      }}
      className="max-w-xl pb-16"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name">
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <Field label="Title">
          <Input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaved(false);
            }}
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Email" hint="Your email is managed by your workspace admin.">
            <Input value={user.email} disabled className="cursor-not-allowed text-ink-soft" />
          </Field>
        </div>
      </div>

      <div className="mt-12">
        <SectionLabel>Notifications</SectionLabel>
        <ul className="divide-y divide-line border-y border-line">
          {prefMeta.map((p) => (
            <li key={p.key} className="flex items-center justify-between gap-6 py-4">
              <div>
                <p className="text-[14px] text-ink">{p.label}</p>
                <p className="mt-0.5 text-[12px] text-ink-softer">{p.hint}</p>
              </div>
              <Toggle
                on={prefs[p.key]}
                label={p.label}
                onToggle={() => {
                  setPrefs((prev) => ({ ...prev, [p.key]: !prev[p.key] }));
                  setSaved(false);
                }}
              />
            </li>
          ))}
        </ul>
      </div>

      {saved && !dirty && (
        <p className="anim-in mt-6 text-[13px] text-ink-soft">Your profile is up to date.</p>
      )}

      {dirty && (
        <div className="anim-up fixed bottom-6 right-8 z-40 flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <span className="px-2 text-[12px] text-ink-soft">Unsaved changes</span>
          <Button type="button" variant="ghost" onClick={discard}>
            Discard
          </Button>
          <Button type="submit" variant="primary">
            Save changes
          </Button>
        </div>
      )}
    </form>
  );
}
