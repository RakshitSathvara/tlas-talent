import { PageHeading } from "@/components/layout/page-heading";
import { requireSession } from "@/lib/auth/session";
import { getPipeline } from "@/features/pipeline/queries";
import { PipelineView } from "@/features/pipeline/components/pipeline-view";

export default async function PipelinePage() {
  const user = await requireSession();
  const candidates = await getPipeline(user.orgId);

  return (
    <div>
      <PageHeading
        eyebrow="Pipeline"
        title="Every candidate, on one board."
        description="Six stages from sourced to hired. Filter by team, then follow a name through to its detail — the board reads left to right, the way a hire actually moves."
      />
      <PipelineView candidates={candidates} />
    </div>
  );
}
