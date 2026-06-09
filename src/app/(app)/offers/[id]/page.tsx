import { notFound } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { SectionLabel } from "@/components/layout/section-label";
import { requireSession } from "@/lib/auth/session";
import { ApprovalChainStepper } from "@/features/requisitions/components/approval-chain-stepper";
import { getOffer } from "@/features/offers/queries";
import { OfferStatusBadge } from "@/features/offers/components/offer-status-badge";
import { OfferTermsCard } from "@/features/offers/components/offer-terms-card";
import { OfferPdfPreview } from "@/features/offers/components/offer-pdf-preview";
import { OfferActions } from "@/features/offers/components/offer-actions";
import { formatDate } from "@/lib/format";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const offer = await getOffer(user.orgId, id);
  if (!offer) notFound();

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1fr_minmax(0,420px)]">
      {/* LEFT — the record */}
      <div className="anim-up">
        <div className="mb-8 flex items-start gap-4">
          <Avatar initials={offer.initials} tint={offer.tint} size={52} />
          <div className="min-w-0 flex-1">
            <div className="smallcaps mb-2 text-[10px] text-accent">Offer</div>
            <h1 className="font-serif text-[36px] font-normal leading-[1.05] text-ink">
              {offer.candidate}
            </h1>
            <p className="mt-1 text-[14px] text-ink-soft">{offer.role}</p>
          </div>
          <OfferStatusBadge status={offer.status} />
        </div>

        <p className="mb-8 text-[13px] text-ink-soft">
          Offered {offer.terms.type.toLowerCase()} at {offer.terms.location}, band{" "}
          {offer.terms.band} · drafted {formatDate(offer.createdOn)}.
        </p>

        <SectionLabel>Terms</SectionLabel>
        <OfferTermsCard terms={offer.terms} />

        <SectionLabel className="mt-10">Approval chain</SectionLabel>
        <div className="rounded-xl border border-line bg-surface px-5 py-6">
          <ApprovalChainStepper steps={offer.approvalChain} />
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <OfferActions offer={offer} />
        </div>
      </div>

      {/* RIGHT — the letter */}
      <div className="anim-up lg:sticky lg:top-6" style={{ animationDelay: "80ms" }}>
        <OfferPdfPreview offer={offer} />
      </div>
    </div>
  );
}
