// server-only: the only place feedback business rules live (BACKEND-ARCHITECTURE.md §8).
// Coupled to interviews: submitting the last outstanding panelist's note for a round flips the
// interview from 'pending_feedback' to 'completed'. Every write runs in a transaction with its
// audit + activity rows, so the change and its record commit atomically.
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { candidates, feedback, interviews, interviewPanelists } from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";
import type { SubmitFeedbackInput } from "./types";

/**
 * Submit structured feedback for an interview. Resolves the candidate from the interview,
 * refuses a duplicate (one note per interviewer+interview), inserts the row with
 * interviewer_id = session.id, then re-derives the interview status: 'completed' once every
 * panelist on that round has filed, else 'pending_feedback'.
 */
export async function submitFeedback(input: SubmitFeedbackInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [iv] = await tx
      .select({
        id: interviews.id,
        candidateId: interviews.candidateId,
        round: interviews.round,
        status: interviews.status,
      })
      .from(interviews)
      .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)))
      .limit(1);
    if (!iv) throw new AppError("NOT_FOUND", "Interview not found.");
    if (iv.status === "cancelled") {
      throw new AppError("CONFLICT", "This interview was cancelled.");
    }

    // Feedback is filed against a specific round — it must match the interview's round, or the
    // completion check (which keys on iv.round) would never see it and the interview would stay
    // stuck in 'pending_feedback'.
    if (input.round !== iv.round) {
      throw new AppError("CONFLICT", "Feedback round must match the interview's round.");
    }

    // Only an assigned panelist may file feedback for this interview (the service layer is the
    // real gate — RLS is bypassed by Drizzle's privileged connection).
    const [panelist] = await tx
      .select({ userId: interviewPanelists.userId })
      .from(interviewPanelists)
      .where(
        and(
          eq(interviewPanelists.interviewId, input.interviewId),
          eq(interviewPanelists.userId, session.id),
          eq(interviewPanelists.orgId, session.orgId),
        ),
      )
      .limit(1);
    if (!panelist) {
      throw new AppError("FORBIDDEN", "You are not on the panel for this interview.");
    }

    // One note per interviewer per interview (mirrors feedback_one_per_interviewer).
    const [dup] = await tx
      .select({ id: feedback.id })
      .from(feedback)
      .where(
        and(
          eq(feedback.orgId, session.orgId),
          eq(feedback.interviewId, input.interviewId),
          eq(feedback.interviewerId, session.id),
        ),
      )
      .limit(1);
    if (dup) {
      throw new AppError("CONFLICT", "You've already filed feedback for this interview.");
    }

    await tx.insert(feedback).values({
      orgId: session.orgId,
      interviewId: input.interviewId,
      candidateId: iv.candidateId,
      interviewerId: session.id,
      round: input.round,
      ratingTechnical: input.ratings.technical,
      ratingCommunication: input.ratings.communication,
      ratingRoleFit: input.ratings.roleFit,
      ratingCultural: input.ratings.cultural,
      recommendation: input.recommendation,
      notes: input.notes ?? null,
    });

    // Re-derive the interview status from panel coverage: a seat is "covered" when that
    // panelist has feedback for this interview's round. All covered -> 'completed'.
    const [{ missing }] = await tx
      .select({ missing: sql<number>`count(*)`.mapWith(Number) })
      .from(interviewPanelists)
      .where(
        and(
          eq(interviewPanelists.interviewId, input.interviewId),
          eq(interviewPanelists.orgId, session.orgId),
          sql`not exists (
            select 1 from ${feedback} f
            where f.org_id = ${session.orgId}
              and f.interview_id = ${input.interviewId}
              and f.round = ${iv.round}
              and f.interviewer_id = ${interviewPanelists.userId}
          )`,
        ),
      );

    const nextStatus: "pending_feedback" | "completed" =
      missing > 0 ? "pending_feedback" : "completed";
    if (nextStatus !== iv.status) {
      await tx
        .update(interviews)
        .set({ status: nextStatus, updatedAt: new Date() })
        .where(and(eq(interviews.id, input.interviewId), eq(interviews.orgId, session.orgId)));
    }

    const [cand] = await tx
      .select({ name: candidates.name })
      .from(candidates)
      .where(and(eq(candidates.id, iv.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "feedback.submitted",
      entityType: "interview",
      entityId: input.interviewId,
      diff: {
        after: {
          candidateId: iv.candidateId,
          round: input.round,
          recommendation: input.recommendation,
          interviewStatus: nextStatus,
        },
      },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "submitted",
      targetType: "interview",
      targetId: input.interviewId,
      summary: `Filed feedback for "${cand?.name ?? "candidate"}" · Round ${input.round}`,
    });

    return { id: input.interviewId, candidateId: iv.candidateId, interviewStatus: nextStatus };
  });
}
