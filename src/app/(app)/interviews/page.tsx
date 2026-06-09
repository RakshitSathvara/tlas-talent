import { PageHeading } from "@/components/layout/page-heading";
import { requireSession } from "@/lib/auth/session";
import { listInterviews } from "@/features/interviews/queries";
import { InterviewsView } from "@/features/interviews/components/interviews-view";

export default async function InterviewsPage() {
  const user = await requireSession();
  const interviews = await listInterviews(user.orgId);

  return (
    <div>
      <PageHeading
        eyebrow="Interviews"
        title="The panel's day, in order."
        description="What's happening today, what's coming, and whose notes are still owed. Open one to read the brief and leave structured feedback."
      />
      <InterviewsView interviews={interviews} />
    </div>
  );
}
