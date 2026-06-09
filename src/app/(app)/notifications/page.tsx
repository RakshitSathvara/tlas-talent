import { PageHeading } from "@/components/layout/page-heading";
import { NotificationList } from "@/features/notifications/components/notification-list";
import { listNotifications } from "@/features/notifications/queries";
import { requireSession } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const user = await requireSession();
  const items = await listNotifications(user.orgId, user.id);

  return (
    <>
      <PageHeading
        eyebrow="Notifications"
        title="What's moved while you were away."
        description="Sign-offs, feedback, and pipeline changes — the things that need a look, newest first."
      />
      <div className="max-w-3xl">
        <NotificationList items={items} />
      </div>
    </>
  );
}
