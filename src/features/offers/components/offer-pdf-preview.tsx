import type { Offer } from "@/types/domain";
import { formatLongDate } from "@/lib/format";

/**
 * A white, paper-like preview of the offer letter (design-system.md §7.5). Static mock —
 * editorial serif headline, an addressed paragraph, and a signature block at the foot.
 */
export function OfferPdfPreview({ offer }: { offer: Offer }) {
  const firstName = offer.candidate.split(" ")[0];

  return (
    <div className="flex h-full min-h-[560px] flex-col rounded-xl border border-line bg-paper p-8">
      <div className="smallcaps text-[11px] tracking-wider text-ink">Atlas talent</div>
      <div className="mt-1 font-mono text-[11px] text-ink-softer">
        {formatLongDate(offer.createdOn)}
      </div>

      <h2 className="mt-10 font-serif text-[26px] font-normal leading-tight text-ink">
        An offer of employment.
      </h2>

      <div className="mt-6 space-y-4 text-[13.5px] leading-relaxed text-ink-soft">
        <p>Dear {firstName},</p>
        <p>
          It is our pleasure to extend an offer to join Atlas talent as{" "}
          <span className="text-ink">{offer.role}</span>, based in{" "}
          <span className="text-ink">{offer.terms.location}</span>. We were impressed by your
          experience and are confident you will make a meaningful contribution to the team.
        </p>
        <p>
          Your annual cost to company will be{" "}
          <span className="font-mono text-ink">{offer.terms.ctc}</span>, with an anticipated start
          date of{" "}
          <span className="font-mono text-ink">{formatLongDate(offer.terms.joiningDate)}</span>.
          This is a {offer.terms.type.toLowerCase()} position at band {offer.terms.band}.
        </p>
        <p>
          We look forward to welcoming you aboard and to the work ahead. Please review the enclosed
          terms and confirm your acceptance at your earliest convenience.
        </p>
      </div>

      <div className="mt-auto pt-12">
        <div className="h-px w-44 bg-line-strong" />
        <div className="mt-2 text-[13px] text-ink">Priya Shah</div>
        <div className="smallcaps text-[10px] text-ink-softer">Head of talent · Atlas talent</div>
      </div>
    </div>
  );
}
