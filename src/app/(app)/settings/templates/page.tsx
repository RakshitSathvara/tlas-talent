import { PageHeading } from "@/components/layout/page-heading";
import { SettingsNav } from "@/features/settings/components/settings-nav";
import { TemplateEditor } from "@/features/settings/components/template-editor";
import { listTemplates } from "@/features/settings/queries";
import { requireSession } from "@/lib/auth/session";

export default async function TemplatesPage() {
  const user = await requireSession();
  const templates = await listTemplates(user.orgId);

  return (
    <>
      <PageHeading
        eyebrow="Templates"
        title="The words you send, ready to reuse."
        description="Email, job descriptions, and offer letters — with variables that fill themselves in."
      />
      <SettingsNav active="templates" />
      <TemplateEditor templates={templates} />
    </>
  );
}
