import { PageHeading } from "@/components/layout/page-heading";
import { Button } from "@/components/ui/button";
import { RequisitionList } from "@/features/requisitions/components/requisition-list";
import { listRequisitions } from "@/features/requisitions/queries";
import { requireSession } from "@/lib/auth/session";

export default async function RequisitionsPage() {
  const user = await requireSession();
  const requisitions = await listRequisitions(user.orgId);

  return (
    <div>
      <div className="flex items-start justify-between gap-6">
        <PageHeading
          eyebrow="Hiring"
          title="Roles we're opening, and the ones we're racing to fill."
          description="Every requisition, from first approval to final offer, with the pipeline behind it."
        />
        <div className="shrink-0 pt-9">
          <Button href="/requisitions/new" variant="accent">
            New requisition
          </Button>
        </div>
      </div>

      <RequisitionList requisitions={requisitions} />
    </div>
  );
}
