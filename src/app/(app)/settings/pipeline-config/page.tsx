import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { StageConfigList } from "@/features/settings/components/stage-config-list";
import { ApprovalChainBuilder } from "@/features/settings/components/approval-chain-builder";
import { getPipelineConfig } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth/session";

export default async function PipelineConfigPage() {
  const user = await requireSession();
  const { stages, chains } = await getPipelineConfig(user.orgId);

  return (
    <>
      <PageHeading
        eyebrow="Pipeline config"
        title="The rules the pipeline runs on."
        description="How long each stage may sit, who owns it, and the sign-offs an offer must clear."
      />
      <SettingsNav active="pipeline" />

      <div className="mb-12">
        <SectionLabel>Stages &amp; SLAs</SectionLabel>
        <StageConfigList stages={stages} />
      </div>

      <div className="pb-12">
        <SectionLabel>Approval chains</SectionLabel>
        <ApprovalChainBuilder chains={chains} />
      </div>
    </>
  );
}
