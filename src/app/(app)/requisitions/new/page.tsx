import { PageHeading } from "@/components/layout/page-heading";
import { RequisitionForm } from "@/features/requisitions/components/requisition-form";

export default function NewRequisitionPage() {
  return (
    <div>
      <PageHeading
        eyebrow="New requisition"
        title="Make the case for a new hire."
        description="Three short steps: the role, the headcount, and who signs off."
      />
      <RequisitionForm mode="create" />
    </div>
  );
}
