"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SectionLabel } from "@/components/layout/section-label";
import { TemplatePreview } from "@/features/settings/components/template-preview";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import type { Template } from "@/types/domain";
import type { TemplateKind } from "@/types/enums";

const kindLabels: Record<TemplateKind, string> = {
  email: "Email",
  jd: "Job description",
  offer: "Offer letter",
};

const kindOrder: TemplateKind[] = ["email", "jd", "offer"];

/** The full templates surface: pick a template on the left, edit + preview on the right. */
export function TemplateEditor({ templates }: { templates: Template[] }) {
  const [selectedId, setSelectedId] = useState(templates[0]?.id ?? "");
  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];

  const [subject, setSubject] = useState(selected?.subject ?? "");
  const [body, setBody] = useState(selected?.body ?? "");
  const [saved, setSaved] = useState(false);

  function select(t: Template) {
    setSelectedId(t.id);
    setSubject(t.subject ?? "");
    setBody(t.body);
    setSaved(false);
  }

  function insertVariable(v: string) {
    setBody((prev) => `${prev}${prev.endsWith(" ") || prev === "" ? "" : " "}{{${v}}}`);
    setSaved(false);
  }

  if (!selected) {
    return null;
  }

  const draft: Template = {
    ...selected,
    subject: selected.subject !== undefined ? subject : undefined,
    body,
  };

  const grouped = kindOrder
    .map((kind) => ({ kind, items: templates.filter((t) => t.kind === kind) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      {/* Left: the list, grouped by kind */}
      <aside className="lg:border-r lg:border-line lg:pr-6">
        {grouped.map((group) => (
          <div key={group.kind} className="mb-6 last:mb-0">
            <span className="smallcaps mb-2 block text-[10px] text-ink-softer">
              {kindLabels[group.kind]}
            </span>
            <ul className="space-y-0.5">
              {group.items.map((t) => {
                const active = t.id === selectedId;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => select(t)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors",
                        active
                          ? "bg-ink text-surface"
                          : "text-ink-soft hover:bg-black/[0.04] hover:text-ink",
                      )}
                    >
                      {t.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </aside>

      {/* Right: editor + live preview */}
      <div className="min-w-0">
        <div className="mb-6 flex items-baseline justify-between gap-4">
          <div>
            <div className="smallcaps mb-1 text-[11px] text-accent">
              {kindLabels[selected.kind]}
            </div>
            <h2 className="font-serif text-[28px] font-normal leading-tight text-ink">
              {selected.name}
            </h2>
          </div>
          <span className="shrink-0 text-[12px] text-ink-softer">
            Updated {formatDate(selected.updatedOn)}
          </span>
        </div>

        {selected.subject !== undefined && (
          <div className="mb-5">
            <span className="smallcaps mb-2 block text-[10px] text-ink-softer">Subject</span>
            <Input
              value={subject}
              onChange={(e) => {
                setSubject(e.target.value);
                setSaved(false);
              }}
            />
          </div>
        )}

        <div className="mb-4">
          <span className="smallcaps mb-2 block text-[10px] text-ink-softer">Body</span>
          <Textarea
            rows={9}
            value={body}
            onChange={(e) => {
              setBody(e.target.value);
              setSaved(false);
            }}
          />
        </div>

        <div className="mb-8">
          <span className="smallcaps mb-2 block text-[10px] text-ink-softer">
            Insert a variable
          </span>
          <div className="flex flex-wrap gap-2">
            {selected.variables.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="rounded-full border border-line bg-paper px-3 py-1 font-mono text-[12px] text-ink-soft transition-colors hover:border-line-strong hover:text-ink"
              >
                {`{{${v}}}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-4 flex items-center gap-3">
          <Button type="button" variant="primary" onClick={() => setSaved(true)}>
            Save template
          </Button>
          {saved && (
            <span className="anim-in text-[13px] text-ink-soft">Saved as the working draft.</span>
          )}
        </div>

        <div className="mt-10">
          <SectionLabel right={<Badge tone="muted">Live</Badge>}>Preview</SectionLabel>
          <TemplatePreview template={draft} />
        </div>
      </div>
    </div>
  );
}
