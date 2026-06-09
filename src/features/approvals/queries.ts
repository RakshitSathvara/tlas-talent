// server-only: Drizzle reads for the leadership approvals queue (BACKEND-ARCHITECTURE.md §7.1–7.2).
// Explicitly org-scoped (Drizzle bypasses RLS). Returns the bare Approval domain shape the queue UI
// consumes — no Result wrapper.
import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { approvalRequests, users } from "@/lib/db/schema";
import type { Approval } from "@/types/domain";

/** Everything awaiting the leader — pending requisitions and offers, in the order raised. */
export async function getPendingApprovals(orgId: string): Promise<Approval[]> {
  const rows = await db
    .select({
      id: approvalRequests.id,
      type: approvalRequests.type,
      title: approvalRequests.title,
      subtitle: approvalRequests.subtitle,
      amount: approvalRequests.amount,
      entityId: approvalRequests.entityId,
      raisedAt: approvalRequests.raisedAt,
      requesterName: users.name,
    })
    .from(approvalRequests)
    .leftJoin(users, eq(users.id, approvalRequests.requesterId))
    .where(and(eq(approvalRequests.orgId, orgId), eq(approvalRequests.state, "pending")))
    .orderBy(asc(approvalRequests.raisedAt));

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    subtitle: r.subtitle ?? "",
    requester: r.requesterName ?? "—",
    raised: r.raisedAt.toISOString().slice(0, 10),
    amount: r.amount ?? undefined,
    entityId: r.entityId,
  }));
}
