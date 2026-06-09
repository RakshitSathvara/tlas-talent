import { PageHeading } from "@/components/layout/page-heading";
import { EmptyState } from "@/components/data/empty-state";
import { requireSession } from "@/lib/auth/session";
import { listOffers } from "@/features/offers/queries";
import { OfferTable } from "@/features/offers/components/offer-table";
import { pluralize } from "@/lib/format";

// Thin server shell: query the offers, render the table.
export default async function OffersPage() {
  const user = await requireSession();
  const offers = await listOffers(user.orgId);

  return (
    <div>
      <PageHeading
        eyebrow="Offers"
        title="Every offer, from draft to signed."
        description={`${pluralize(offers.length, "offer")} moving through approval, out the door, and back accepted.`}
      />
      {offers.length === 0 ? (
        <EmptyState>No offers have been drafted yet.</EmptyState>
      ) : (
        <OfferTable offers={offers} />
      )}
    </div>
  );
}
