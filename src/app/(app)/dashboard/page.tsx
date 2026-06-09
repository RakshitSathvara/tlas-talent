import { requireSession } from "@/lib/auth/session";
import {
  getAdminDashboard,
  getHrDashboard,
  getInterviewerDashboard,
  getLeadershipDashboard,
} from "@/features/dashboard/queries";
import { HRDashboard } from "@/features/dashboard/components/hr-dashboard";
import { LeadershipDashboard } from "@/features/dashboard/components/leadership-dashboard";
import { InterviewerDashboard } from "@/features/dashboard/components/interviewer-dashboard";
import { AdminDashboard } from "@/features/dashboard/components/admin-dashboard";
import { DeniedBanner } from "@/features/dashboard/components/denied-banner";

/**
 * `/dashboard` branches by the signed-in role rather than gating (frontend-architecture.md §5.3).
 * Role is fixed by login, so the server resolves the session, fetches that role's aggregates, and
 * renders its dashboard. The keyed wrapper replays the page-mount fade (design-system.md §4.2).
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ denied?: string }>;
}) {
  const { denied } = await searchParams;
  const user = await requireSession();

  return (
    <>
      {denied ? <DeniedBanner /> : null}
      <div key={user.role} className="anim-in">
        {user.role === "hr" && <HRDashboard data={await getHrDashboard(user.orgId)} />}
        {user.role === "leadership" && (
          <LeadershipDashboard data={await getLeadershipDashboard(user.orgId, user.id)} />
        )}
        {user.role === "interviewer" && (
          <InterviewerDashboard data={await getInterviewerDashboard(user.orgId, user.id)} />
        )}
        {user.role === "admin" && <AdminDashboard data={await getAdminDashboard(user.orgId)} />}
      </div>
    </>
  );
}
