// server-only: the only place candidate business rules live (BACKEND-ARCHITECTURE.md §8).
// Every write runs in a transaction with its audit + activity rows (and notifications where
// relevant), so the change and its record commit atomically.
import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  candidates,
  candidateStageHistory,
  feedback,
  files,
  interviews,
  interviewPanelists,
} from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { insertActivity } from "@/lib/db/repositories/activity";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import { initials as toInitials } from "@/lib/format";
import type { SessionUser } from "@/types/domain";
import type { StageKey } from "@/types/enums";
import type {
  CreateCandidateInput,
  AdvanceStageInput,
  RejectCandidateInput,
  CreateResumeUploadUrlInput,
  ConfirmResumeUploadInput,
} from "./types";

const RESUME_BUCKET = "resumes";

// A small, deterministic palette for new-candidate avatar tints (design-system.md §2.5).
const TINTS = ["#D4A574", "#A18BBF", "#8DAFB3", "#C8A48F", "#B5907C", "#9CB39B", "#A88B6E"];

/**
 * Create a candidate. Dedup gate: refuse if a non-rejected candidate with the same lower(email)
 * or phone already exists in the org. Opens at stage 'sourced' with the first history row.
 */
export async function createCandidate(input: CreateCandidateInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const phone = input.phone?.trim() || null;
    const [dup] = await tx
      .select({ id: candidates.id })
      .from(candidates)
      .where(
        and(
          eq(candidates.orgId, session.orgId),
          sql`${candidates.stage} <> 'rejected'`,
          phone
            ? sql`(lower(${candidates.email}) = lower(${input.email}) or ${candidates.phone} = ${phone})`
            : sql`lower(${candidates.email}) = lower(${input.email})`,
        ),
      )
      .limit(1);
    if (dup) {
      throw new AppError(
        "CONFLICT",
        "A candidate with this email or phone already exists in the pipeline.",
      );
    }

    const [cand] = await tx
      .insert(candidates)
      .values({
        orgId: session.orgId,
        requisitionId: input.requisitionId ?? null,
        name: input.name,
        role: input.role,
        stage: "sourced",
        experience: input.experience ?? null,
        location: input.location ?? null,
        email: input.email,
        phone,
        source: input.source ?? null,
        expectedCtcDisplay: input.expectedCtcDisplay ?? null,
        noticePeriod: input.noticePeriod ?? null,
        summary: input.summary ?? null,
        initials: toInitials(input.name),
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
      })
      .returning({ id: candidates.id });

    if (!cand) throw new AppError("INTERNAL", "Failed to create candidate.");

    await tx.insert(candidateStageHistory).values({
      orgId: session.orgId,
      candidateId: cand.id,
      stage: "sourced",
      changedBy: session.id,
    });

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "candidate.created",
      entityType: "candidate",
      entityId: cand.id,
      diff: { after: { name: input.name, role: input.role, stage: "sourced" } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "created",
      targetType: "candidate",
      targetId: cand.id,
      summary: `Added candidate "${input.name}"`,
    });

    return { id: cand.id, stage: "sourced" as const };
  });
}

/**
 * Advance a candidate to a later stage. Stage-gate: moving past 'interview' (to 'offer'/'hired')
 * requires that every panelist on the candidate's latest interview round has filed feedback,
 * else STAGE_GATE. Updates candidates.stage and appends a history row.
 */
export async function advanceStage(input: AdvanceStageInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [cand] = await tx
      .select({ id: candidates.id, name: candidates.name, stage: candidates.stage })
      .from(candidates)
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);
    if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");

    // Stage-gate: advancing past Interview demands complete panel feedback for the latest round.
    if (input.toStage === "offer" || input.toStage === "hired") {
      const [latest] = await tx
        .select({ round: interviews.round })
        .from(interviews)
        .where(
          and(
            eq(interviews.orgId, session.orgId),
            eq(interviews.candidateId, input.candidateId),
          ),
        )
        .orderBy(sql`${interviews.round} desc`)
        .limit(1);

      if (latest) {
        // A panel seat counts as "covered" when that panelist has feedback for the same round.
        const [{ missing }] = await tx
          .select({
            missing: sql<number>`count(*)`.mapWith(Number),
          })
          .from(interviews)
          .innerJoin(
            interviewPanelists,
            eq(interviewPanelists.interviewId, interviews.id),
          )
          .where(
            and(
              eq(interviews.orgId, session.orgId),
              eq(interviewPanelists.orgId, session.orgId),
              eq(interviews.candidateId, input.candidateId),
              eq(interviews.round, latest.round),
              sql`not exists (
                select 1 from ${feedback} f
                where f.org_id = ${session.orgId}
                  and f.candidate_id = ${input.candidateId}
                  and f.round = ${latest.round}
                  and f.interviewer_id = ${interviewPanelists.userId}
              )`,
            ),
          );

        if (missing > 0) {
          throw new AppError(
            "STAGE_GATE",
            "Cannot advance past Interview until all panel feedback for the round is submitted",
          );
        }
      }
    }

    const toStage = input.toStage as StageKey;

    await tx
      .update(candidates)
      .set({ stage: toStage, updatedAt: new Date() })
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)));

    await tx.insert(candidateStageHistory).values({
      orgId: session.orgId,
      candidateId: input.candidateId,
      stage: toStage,
      note: input.note ?? null,
      changedBy: session.id,
    });

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "candidate.advanced",
      entityType: "candidate",
      entityId: input.candidateId,
      diff: { before: { stage: cand.stage }, after: { stage: toStage } },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "advanced",
      targetType: "candidate",
      targetId: input.candidateId,
      summary: `Advanced "${cand.name}" to ${toStage}`,
    });

    return { id: input.candidateId, stage: toStage };
  });
}

/** Reject a candidate: stage 'rejected' + a history row carrying the reason. */
export async function rejectCandidate(input: RejectCandidateInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [cand] = await tx
      .select({ id: candidates.id, name: candidates.name, stage: candidates.stage })
      .from(candidates)
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)))
      .limit(1);
    if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");
    if (cand.stage === "rejected") {
      throw new AppError("CONFLICT", "Candidate is already rejected.");
    }

    await tx
      .update(candidates)
      .set({ stage: "rejected", updatedAt: new Date() })
      .where(and(eq(candidates.id, input.candidateId), eq(candidates.orgId, session.orgId)));

    await tx.insert(candidateStageHistory).values({
      orgId: session.orgId,
      candidateId: input.candidateId,
      stage: "rejected",
      note: input.reason,
      changedBy: session.id,
    });

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "candidate.rejected",
      entityType: "candidate",
      entityId: input.candidateId,
      diff: { before: { stage: cand.stage }, reason: input.reason },
    });
    await insertActivity(tx, {
      orgId: session.orgId,
      actorId: session.id,
      verb: "rejected",
      targetType: "candidate",
      targetId: input.candidateId,
      summary: `Rejected "${cand.name}"`,
    });

    return { id: input.candidateId, stage: "rejected" as const };
  });
}

/* ───────────────────────────── Resume upload ───────────────────────────── */

/** Verify a candidate is in the caller's org (shared by both resume steps). */
async function assertCandidateInOrg(candidateId: string, orgId: string): Promise<void> {
  const [cand] = await db
    .select({ id: candidates.id })
    .from(candidates)
    .where(and(eq(candidates.id, candidateId), eq(candidates.orgId, orgId)))
    .limit(1);
  if (!cand) throw new AppError("NOT_FOUND", "Candidate not found.");
}

/** Strip a filename to a storage-safe slug (no path separators, ascii-ish). */
function safeFileName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, "") : "";
  const slug = base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  const stem = slug || "resume";
  return ext ? `${stem}.${ext}` : stem;
}

/**
 * Step 1 of the presigned resume flow (BACKEND-ARCHITECTURE.md §13.4). Verifies the candidate
 * belongs to the caller's org, derives an org-namespaced storage path, and asks Storage for a
 * single-use signed PUT URL. No DB write happens here — the `files` row lands in step 2.
 */
export async function createResumeUploadUrl(
  input: CreateResumeUploadUrlInput,
  session: SessionUser,
) {
  await assertCandidateInOrg(input.candidateId, session.orgId);

  // `${orgId}/${candidateId}/${timestampish}-${safeFileName}` — tenant-namespaced, collision-safe.
  const storagePath = `${session.orgId}/${input.candidateId}/${Date.now()}-${safeFileName(input.fileName)}`;

  const { data, error } = await supabaseAdmin.storage
    .from(RESUME_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new AppError("INTERNAL", "Could not start the resume upload. Please retry.");
  }

  return { uploadUrl: data.signedUrl, token: data.token, storagePath };
}

/**
 * Step 2 of the presigned resume flow: persist the `files` row after the client has PUT the
 * bytes to Storage. Re-validates org + that the storage path is inside the candidate's org
 * namespace, then records the file + an audit entry in one transaction.
 */
export async function confirmResumeUpload(
  input: ConfirmResumeUploadInput,
  session: SessionUser,
) {
  await assertCandidateInOrg(input.candidateId, session.orgId);

  // Never trust the client path blindly — it must live under this org + candidate prefix.
  const expectedPrefix = `${session.orgId}/${input.candidateId}/`;
  if (!input.storagePath.startsWith(expectedPrefix)) {
    throw new AppError("VALIDATION", "Invalid storage path for this candidate.");
  }

  return db.transaction(async (tx) => {
    const [file] = await tx
      .insert(files)
      .values({
        orgId: session.orgId,
        entityType: "candidate",
        entityId: input.candidateId,
        storageBucket: RESUME_BUCKET,
        storagePath: input.storagePath,
        contentType: input.contentType,
        sizeBytes: input.sizeBytes,
        uploadedBy: session.id,
      })
      .returning({ id: files.id });

    if (!file) throw new AppError("INTERNAL", "Failed to record the uploaded resume.");

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "candidate.resume_uploaded",
      entityType: "candidate",
      entityId: input.candidateId,
      diff: { after: { storagePath: input.storagePath, contentType: input.contentType } },
    });

    return { fileId: file.id };
  });
}
