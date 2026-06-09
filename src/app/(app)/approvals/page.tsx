import { PageHeading } from "@/components/layout/page-heading";
import { getPendingApprovals } from "@/features/approvals/queries";
import { ApprovalQueue } from "@/features/approvals/components/approval-queue";
import { requireSession } from "@/lib/auth/session";
import { spellTitle } from "@/lib/format";

// Thin server shell: query the queue, render it. The title reads the count out loud.
export default async function ApprovalsPage() {
  const user = await requireSession();
  const approvals = await getPendingApprovals(user.orgId);
  const count = approvals.length;

  const title =
    count === 0
      ? "Nothing needs you today."
      : count === 1
        ? "One thing needs you today."
        : `${spellTitle(count)} things need you today.`;

  return (
    <div>
      <PageHeading
        eyebrow="Leadership"
        title={title}
        description="Requisitions and offers waiting on your sign-off, oldest first."
      />
      <ApprovalQueue approvals={approvals} />
    </div>
  );
}
