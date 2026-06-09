// Append-only activity-feed writer (BACKEND-ARCHITECTURE.md §6). Feeds the dashboard activity
// widget; written in the mutation's transaction. Realtime fires automatically on the insert.
import "server-only";
import type { Tx } from "@/lib/db/client";
import { activities } from "@/lib/db/schema";

export interface ActivityInput {
  orgId: string;
  actorId: string | null;
  verb: string; // 'created' | 'advanced' | 'approved' | ...
  targetType: string; // 'requisition' | 'candidate' | 'offer' | ...
  targetId: string;
  summary: string;
}

export async function insertActivity(tx: Tx, input: ActivityInput): Promise<void> {
  await tx.insert(activities).values({
    orgId: input.orgId,
    actorId: input.actorId,
    verb: input.verb,
    targetType: input.targetType,
    targetId: input.targetId,
    summary: input.summary,
  });
}
