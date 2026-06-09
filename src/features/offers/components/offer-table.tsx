import Link from "next/link";
import type { Offer } from "@/types/domain";
import { Avatar } from "@/components/ui/avatar";
import { formatDate } from "@/lib/format";
import { OfferStatusBadge } from "./offer-status-badge";

/**
 * Bespoke offer list (design-system.md §7.1). Each row lifts on hover and links to the
 * offer detail. The grid template is shared by the header and the rows so columns align.
 */
const COLS = "grid grid-cols-[minmax(0,1fr)_140px_110px_140px_110px] items-center gap-4";

export function OfferTable({ offers }: { offers: Offer[] }) {
  return (
    <div>
      <div
        className={`${COLS} border-b border-line px-4 pb-2.5 smallcaps text-[10px] text-ink-softer`}
      >
        <span>Candidate</span>
        <span>Role</span>
        <span>CTC</span>
        <span>Status</span>
        <span className="text-right">Created</span>
      </div>

      <div className="divide-y divide-line">
        {offers.map((offer) => (
          <Link
            key={offer.id}
            href={`/offers/${offer.id}`}
            className={`${COLS} lift rounded-lg px-4 py-3.5`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Avatar initials={offer.initials} tint={offer.tint} size={32} />
              <span className="truncate text-[14px] font-medium text-ink">{offer.candidate}</span>
            </span>
            <span className="truncate text-[13px] text-ink-soft">{offer.role}</span>
            <span className="font-mono text-[13px] text-ink">{offer.terms.ctc}</span>
            <span>
              <OfferStatusBadge status={offer.status} />
            </span>
            <span className="text-right font-mono text-[12px] text-ink-softer">
              {formatDate(offer.createdOn)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
