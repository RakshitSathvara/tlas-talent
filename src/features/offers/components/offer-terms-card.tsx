import type { OfferTerms } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

/** The offer's commercial terms as aligned label/value rows (design-system.md §7.3). */
export function OfferTermsCard({ terms }: { terms: OfferTerms }) {
  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: "Band", value: terms.band, mono: true },
    { label: "CTC", value: terms.ctc, mono: true },
    { label: "Location", value: terms.location },
    { label: "Joining date", value: formatDate(terms.joiningDate), mono: true },
    { label: "Type", value: terms.type },
  ];

  return (
    <Card>
      <dl className="divide-y divide-line">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <dt className="smallcaps text-[10px] text-ink-softer">{row.label}</dt>
            <dd
              className={
                row.mono
                  ? "font-mono text-[13px] text-ink"
                  : "text-[13px] text-ink"
              }
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
