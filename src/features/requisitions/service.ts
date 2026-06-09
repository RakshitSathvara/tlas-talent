// server-only: the only place requisition business rules live (BACKEND-ARCHITECTURE.md §8).
// Every write runs in a transaction with its audit + activity rows, so the change and its
// record commit atomically.
import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  approvalChainConfig,
  approvalRequests,
  approvalSteps,
  requisitions,
  users,
} from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { insertNotification } from "@/lib/db/repositories/notifications";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";
import type {
  CreateRequisitionInput,
  EditRequisitionInput,
  UpdateNotesInput,
  CloseRequisitionInput,
} from "./types";

/**
 * Create a requisition. Band gate: if `approval_chain_config` has a non-empty chain for the
 * requisition's band, it enters `pending_approval` and the chain is materialized into
 * approval_requests + approval_steps (approvers notified); otherwise it opens immediately.
 */
export async function createRequisition(input: CreateRequisitionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [cfg] = await tx
      .select()
      .from(approvalChainConfig)
      .where(
        and(
          eq(approvalChainConfig.orgId, session.orgId),
          eq(approvalChainConfig.band, input.band),
        ),
      )
      .limit(1);

    const chain = cfg?.chain ?? [];
    const needsApproval = chain.length > 0;

    const [req] = await tx
      .insert(requisitions)
      .values({
        orgId: session.orgId,
        title: input.title,
        team: input.team,
        location: input.location,
        openings: input.openings,
        priority: input.priority,
        band: input.band,
        bandMin: String(input.bandMin),
        bandMax: String(input.bandMax),
        raisedBy: session.id,
        description: input.description,
        status: needsApproval ? "pending_approval" : "open",
      })
      .returning({ id: requisitions.id, status: requisitions.status });

    if (!req) throw new AppError("INTERNAL", "Failed to create requisition.");

    if (needsApproval) {
      const [ar] = await tx
        .insert(approvalRequests)
        .values({
          orgId: session.orgId,
          type: "requisition",
          entityId: req.id,
          requesterId: session.id,
          title: input.title,
          subtitle: `${input.team} · ${input.location}`,
          amount: String(input.bandMax),
          state: "pending",
        })
        .returning({ id: approvalRequests.id });

      if (ar) {
        await tx.insert(approvalSteps).values(
          chain.map((label, i) => ({
            orgId: session.orgId,
            approvalRequestId: ar.id,
            stepOrder: i + 1,
            role: label,
            state: "pending" as const,
          })),
        );
      }

      // Approvers (leadership/admin) own the approvals queue — notify them.
      const approvers = await tx
        .select({ id: users.id })
        .from(users)
        .where(
          and(
            eq(users.orgId, session.orgId),
            inArray(users.role, ["leadership", "admin"]),
            eq(users.isActive, true),
          ),
        );
      for (const a of approvers) {
        await insertNotification(tx, {
          orgId: session.orgId,
          recipientId: a.id,
          kind: "approval",
          title: "Requisition needs approval",
          body: input.title,
          href: "/approvals",
        });
      }
    }

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "requisition.created",
      entityType: "requisition",
      entityId: req.id,
      diff: { after: { title: input.title, status: req.status } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "created",
      targetType: "requisition",
      targetId: req.id,
      summary: `Raised requisition "${input.title}"`,
    });

    return { id: req.id, status: req.status };
  });
}

/** Edit an open/pending requisition. Band changes do NOT rebuild an in-flight chain. */
export async function editRequisition(input: EditRequisitionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(requisitions)
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Requisition not found.");
    if (existing.status === "closed" || existing.status === "filled") {
      throw new AppError("CONFLICT", "A closed or filled requisition can't be edited.");
    }

    await tx
      .update(requisitions)
      .set({
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.team !== undefined ? { team: input.team } : {}),
        ...(input.location !== undefined ? { location: input.location } : {}),
        ...(input.openings !== undefined ? { openings: input.openings } : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.band !== undefined ? { band: input.band } : {}),
        ...(input.bandMin !== undefined ? { bandMin: String(input.bandMin) } : {}),
        ...(input.bandMax !== undefined ? { bandMax: String(input.bandMax) } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "requisition.updated",
      entityType: "requisition",
      entityId: input.id,
      diff: { changed: input },
    });

    return { id: input.id };
  });
}

/** Autosave-friendly notes update — just the description column. */
export async function updateRequisitionNotes(input: UpdateNotesInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: requisitions.id })
      .from(requisitions)
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Requisition not found.");

    await tx
      .update(requisitions)
      .set({ description: input.description, updatedAt: new Date() })
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "requisition.notes_updated",
      entityType: "requisition",
      entityId: input.id,
    });

    return { id: input.id };
  });
}

/** Close a requisition. Idempotency guard: already-closed returns a CONFLICT. */
export async function closeRequisition(input: CloseRequisitionInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(requisitions)
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Requisition not found.");
    if (existing.status === "closed") {
      throw new AppError("CONFLICT", "Requisition is already closed.");
    }

    await tx
      .update(requisitions)
      .set({ status: "closed", updatedAt: new Date() })
      .where(and(eq(requisitions.id, input.id), eq(requisitions.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "requisition.closed",
      entityType: "requisition",
      entityId: input.id,
      diff: { reason: input.reason ?? null },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "closed",
      targetType: "requisition",
      targetId: input.id,
      summary: `Closed requisition "${existing.title}"`,
    });

    return { id: input.id, status: "closed" as const };
  });
}
