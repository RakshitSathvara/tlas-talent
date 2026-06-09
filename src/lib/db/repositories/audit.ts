// Append-only audit writer (BACKEND-ARCHITECTURE.md §4.5, §6). Called inside the same
// transaction as the mutation it records, so the business change and its audit row commit
// atomically. audit_log is the durable business record — distinct from operational logs.
import "server-only";
import type { Tx } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

export interface AuditInput {
  orgId: string;
  actorId: string | null;
  action: string; // e.g. 'requisition.created'
  entityType: string;
  entityId: string;
  diff?: Record<string, unknown>;
}

export async function insertAudit(tx: Tx, input: AuditInput): Promise<void> {
  await tx.insert(auditLog).values({
    orgId: input.orgId,
    actorId: input.actorId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    diff: input.diff ?? null,
  });
}
