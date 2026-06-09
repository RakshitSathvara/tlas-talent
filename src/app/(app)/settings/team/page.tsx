import { PageHeading } from "@/components/layout/page-heading";
import { SectionLabel } from "@/components/layout/section-label";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { InviteUserModal } from "@/features/settings/components/invite-user-modal";
import { UserTable } from "@/features/settings/components/user-table";
import { listUsers } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth/session";

export default async function TeamPage() {
  const user = await requireSession();
  const users = await listUsers(user.orgId);

  return (
    <>
      <PageHeading
        eyebrow="Team"
        title="The people who move the pipeline."
        description="Everyone with a seat in this workspace, and the role that shapes what they see."
      />
      <SettingsNav active="team" />
      <SectionLabel right={<InviteUserModal />}>People</SectionLabel>
      <UserTable users={users} />
    </>
  );
}
