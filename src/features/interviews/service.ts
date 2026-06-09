// server-only: the only place interview business rules live (BACKEND-ARCHITECTURE.md §8).
// Every write runs in a transaction with its audit + activity rows (and notifications where
// relevant), so the change and its record commit atomically.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { candidates, interviews, interviewPanelists, users } from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { insertNotification } from "@/lib/db/repositories/notifications";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";
import type {
  ScheduleInterviewInput,
  RescheduleInterviewInput,
  CancelInterviewInput,
} from "./types";

/**
 * Schedule an interview for a candidate. Inserts the interview ('upcoming'), one
 * interview_panelists row per panelist, and notifies every panelist. The candidate (and any
 * panelist) must belong to the session's org.
 */
export async function scheduleInterview(input: ScheduleInterviewInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [cand] = await tx
      .select({ id: candidates.id, name: candidates.name })
      .from(candidates)
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);
    if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");

    // Every panelist must be an active user in the same org (no cross-tenant panel seats).
    const panelists = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, session.orgId), eq(users.isActive, true)));
    const validIds = new Set(panelists.map((u) => u.id));
    const missing = input.panelistIds.filter((id) => !validIds.has(id));
    if (missing.length > 0) {
      throw new AppError("NOT_FOUND", "One or more panelists are not in this organization.");
    }

    const [iv] = await tx
      .insert(interviews)
      .values({
        orgId: session.orgId,
        candidateId: input.candidateId,
        requisitionId: input.requisitionId ?? null,
        scheduledAt: new Date(input.scheduledAt),
        round: input.round,
        durationMinutes: input.durationMinutes,
        mode: input.mode,
        status: "upcoming",
      })
      .returning({ id: interviews.id });

    if (!iv) throw new AppError("INTERNAL", "Failed to schedule interview.");

    // De-dupe panelist ids before fanning out rows + notifications.
    const uniquePanelistIds = [...new Set(input.panelistIds)];
    await tx.insert(interviewPanelists).values(
      uniquePanelistIds.map((userId) => ({
        orgId: session.orgId,
        interviewId: iv.id,
        userId,
      })),
    );

    for (const userId of uniquePanelistIds) {
      await insertNotification(tx, {
        orgId: session.orgId,
        recipientId: userId,
        kind: "interview",
        title: "You're on an interview panel",
        body: `${cand.name} · Round ${input.round}`,
        href: `/interviews/${iv.id}`,
      });
    }

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "interview.scheduled",
      entityType: "interview",
      entityId: iv.id,
      diff: {
        after: {
          candidateId: input.candidateId,
          round: input.round,
          scheduledAt: input.scheduledAt,
        },
      },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "scheduled",
      targetType: "interview",
      targetId: iv.id,
      summary: `Scheduled Round ${input.round} with "${cand.name}"`,
    });

    return { id: iv.id, status: "upcoming" as const };
  });
}

/** Reschedule an interview — just move scheduled_at. Cancelled interviews can't be moved. */
export async function rescheduleInterview(
  input: RescheduleInterviewInput,
  session: SessionUser,
) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: interviews.id, status: interviews.status, scheduledAt: interviews.scheduledAt })
      .from(interviews)
      .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Interview not found.");
    if (existing.status === "cancelled") {
      throw new AppError("CONFLICT", "A cancelled interview can't be rescheduled.");
    }

    await tx
      .update(interviews)
      .set({ scheduledAt: new Date(input.scheduledAt), updatedAt: new Date() })
      .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "interview.rescheduled",
      entityType: "interview",
      entityId: input.interviewId,
      diff: {
        before: { scheduledAt: existing.scheduledAt.toISOString() },
        after: { scheduledAt: input.scheduledAt },
      },
    });

    return { id: input.interviewId };
  });
}

/** Cancel an interview: status 'cancelled'. Idempotency guard: already-cancelled is a CONFLICT. */
export async function cancelInterview(input: CancelInterviewInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: interviews.id, status: interviews.status, candidateId: interviews.candidateId })
      .from(interviews)
      .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Interview not found.");
    if (existing.status === "cancelled") {
      throw new AppError("CONFLICT", "Interview is already cancelled.");
    }

    await tx
      .update(interviews)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "interview.cancelled",
      entityType: "interview",
      entityId: input.interviewId,
      diff: { reason: input.reason ?? null },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "cancelled",
      targetType: "interview",
      targetId: input.interviewId,
      summary: "Cancelled an interview",
    });

    return { id: input.interviewId, status: "cancelled" as const };
  });
}
