import { Fragment } from "react";
import { Card } from "@/components/ui/card";
import type { Template } from "@/types/domain";

// Split keeps the captured {{...}} tokens as their own array entries.
const VAR_SPLIT = /(\{\{[^}]+\}\})/g;
const isVar = (part: string) => part.startsWith("{{") && part.endsWith("}}");

/** Render text, wrapping every {{variable}} token in an accent-soft chip. */
function highlight(text: string) {
  return text.split(VAR_SPLIT).map((part, i) =>
    isVar(part) ? (
      <span
        key={i}
        className="rounded bg-accent-soft px-1 py-0.5 font-mono text-[12.5px] text-accent-ink"
      >
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

/** A reader's view of a template — subject (if any) over body, variables lit up. */
export function TemplatePreview({ template }: { template: Template }) {
  return (
    <Card className="bg-paper" padded>
      {template.subject !== undefined && (
        <div className="mb-4 border-b border-line pb-4">
          <span className="smallcaps mb-1.5 block text-[10px] text-ink-softer">Subject</span>
          <p className="text-[14px] leading-relaxed text-ink">{highlight(template.subject)}</p>
        </div>
      )}
      <span className="smallcaps mb-1.5 block text-[10px] text-ink-softer">Body</span>
      <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-ink-soft">
        {highlight(template.body)}
      </p>
    </Card>
  );
}
