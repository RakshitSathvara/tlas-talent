import { PageHeading } from "@/components/layout/page-heading";
import { CandidateDirectory } from "@/features/candidates/components/candidate-directory";
import { searchCandidates } from "@/features/candidates/queries";
import { requireSession } from "@/lib/auth/session";

export default async function CandidatesPage() {
  const user = await requireSession();
  const candidates = await searchCandidates(user.orgId);

  return (
    <div>
      <PageHeading
        eyebrow="Candidates"
        title="Everyone in the running, in one place."
        description="Search the directory, filter by stage, and open a profile to read the timeline, panel feedback and résumé."
      />
      <CandidateDirectory candidates={candidates} />
    </div>
  );
}
