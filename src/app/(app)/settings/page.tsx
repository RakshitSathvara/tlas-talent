import { PageHeading } from "@/components/layout/page-heading";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { SettingsProfileForm } from "@/features/settings/components/settings-profile-form";
import { getProfile } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth/session";

export default async function SettingsPage() {
  const session = await requireSession();
  const user = await getProfile(session);

  return (
    <>
      <PageHeading
        eyebrow="Settings"
        title="Your profile, the way the team sees you."
        description="Your name, title, and how Atlas reaches you about the work that needs you."
      />
      <SettingsNav active="profile" />
      <SettingsProfileForm user={user} />
    </>
  );
}
