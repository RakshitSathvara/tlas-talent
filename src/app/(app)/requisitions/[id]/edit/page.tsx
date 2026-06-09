import { notFound } from "next/navigation";
import { PageHeading } from "@/components/layout/page-heading";
import { RequisitionForm } from "@/features/requisitions/components/requisition-form";
import { getRequisition } from "@/features/requisitions/queries";
import { requireSession } from "@/lib/auth/session";

export default async function EditRequisitionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireSession();
  const req = await getRequisition(user.orgId, id);
  if (!req) notFound();

  return (
    <div>
      <PageHeading
        eyebrow="Edit requisition"
        title={`Tidy up ${req.title}.`}
        description="Adjust the role, headcount, or band — the approval routing updates to match."
      />
      <RequisitionForm mode="edit" initial={req} />
    </div>
  );
}
