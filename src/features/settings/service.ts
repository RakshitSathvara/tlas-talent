// server-only: the only place settings / admin business rules live (BACKEND-ARCHITECTURE.md §8).
// Every write runs in a transaction with its audit row, so the change and its record commit
// atomically. inviteUser additionally provisions a Supabase Auth user via the service-role admin
// client (app_metadata carries role/org_id so the JWT can carry the claims) — mirroring how
// scripts/seed.ts does getOrCreateAuthUser.
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  approvalChainConfig,
  stageConfig,
  templates,
  users,
} from "@/lib/db/schema";
import { insertAudit } from "@/lib/db/repositories/audit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";
import { initials as toInitials } from "@/lib/format";
import type { SessionUser } from "@/types/domain";
import type {
  UpdateProfileInput,
  InviteUserInput,
  ChangeRoleInput,
  DeactivateUserInput,
  UpdateStageConfigInput,
  UpdateApprovalChainInput,
  CreateTemplateInput,
  UpdateTemplateInput,
  DeleteTemplateInput,
} from "./types";

// A muted earth-tone palette for new avatars (design-system.md §2.5) — picked by a stable hash
// of the email so a teammate's tint is consistent across re-invites.
const TINTS = [
  "#D4A574",
  "#C8A48F",
  "#A88B6E",
  "#5A6F8C",
  "#9CB39B",
  "#8DAFB3",
  "#B898A8",
  "#B5907C",
];
function tintFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
}

/** Update the signed-in user's own profile (name + title). Self-service; no capability needed. */
export async function updateProfile(input: UpdateProfileInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({
        name: input.name,
        title: input.title,
        initials: toInitials(input.name),
        updatedAt: new Date(),
      })
      .where(and(eq(users.id, session.id), eq(users.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "user.profile_updated",
      entityType: "user",
      entityId: session.id,
      diff: { after: { name: input.name, title: input.title } },
    });

    return { id: session.id };
  });
}

/**
 * Invite a new teammate. Provisions a Supabase Auth user via the service-role admin client
 * (app_metadata carries role/org_id so the JWT can carry the claims), then inserts the
 * public.users row linked by auth_user_id. The invite email lands them on the set-password flow.
 */
export async function inviteUser(input: InviteUserInput, session: SessionUser) {
  // 1) provision the auth user (outside the tx — it's an external service call). Try an invite
  //    email first; fall back to finding an already-existing auth user (idempotent re-invite).
  let authUserId: string;
  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
    data: { name: input.name },
  });
  if (!error && data?.user) {
    authUserId = data.user.id;
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: { role: input.role, org_id: session.orgId },
    });
    if (metaError) {
      throw new AppError(
        "INTERNAL",
        `Invited ${input.email} but failed to set their role/org claims — they can't sign in until this is retried: ${metaError.message}`,
      );
    }
  } else {
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const found = list?.users.find((u) => u.email?.toLowerCase() === input.email.toLowerCase());
    if (!found) {
      throw new AppError("INTERNAL", `Could not invite ${input.email}: ${error?.message ?? "unknown error"}`);
    }
    authUserId = found.id;
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(authUserId, {
      app_metadata: { role: input.role, org_id: session.orgId },
    });
    if (metaError) {
      throw new AppError(
        "INTERNAL",
        `Invited ${input.email} but failed to set their role/org claims — they can't sign in until this is retried: ${metaError.message}`,
      );
    }
  }

  // 2) insert the public.users row (org-scoped) + audit, atomically.
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, session.orgId), eq(users.email, input.email)))
      .limit(1);
    if (existing) throw new AppError("CONFLICT", "Someone with that email is already in the workspace.");

    const [user] = await tx
      .insert(users)
      .values({
        orgId: session.orgId,
        authUserId,
        name: input.name,
        email: input.email,
        role: input.role,
        title: input.title ?? null,
        initials: toInitials(input.name),
        tint: tintFor(input.email),
        isActive: true,
      })
      .returning({ id: users.id });

    if (!user) throw new AppError("INTERNAL", "Failed to add the user to the workspace.");

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "user.invited",
      entityType: "user",
      entityId: user.id,
      diff: { after: { email: input.email, role: input.role } },
    });

    return { id: user.id };
  });
}

/**
 * Change a teammate's role. Updates users.role and refreshes the Supabase app_metadata claim.
 * NOTE: the JWT only carries the new role after the user re-authenticates (the access-token hook
 * reads app_metadata at sign-in); existing sessions keep the old claim until then.
 */
export async function changeRole(input: ChangeRoleInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, input.userId), eq(users.orgId, session.orgId)))
      .limit(1);
    if (!target) throw new AppError("NOT_FOUND", "User not found.");

    await tx
      .update(users)
      .set({ role: input.role, updatedAt: new Date() })
      .where(and(eq(users.id, input.userId), eq(users.orgId, session.orgId)));

    // Refresh the JWT claim source so the next sign-in carries the new role.
    if (target.authUserId) {
      await supabaseAdmin.auth.admin.updateUserById(target.authUserId, {
        app_metadata: { role: input.role, org_id: session.orgId },
      });
    }
    // TODO: revoke the target's active sessions so the new role claim takes effect immediately
    //       (supabaseAdmin.auth.admin.signOut(authUserId)) once session revocation is wired.

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "user.role_changed",
      entityType: "user",
      entityId: input.userId,
      diff: { before: { role: target.role }, after: { role: input.role } },
    });

    return { id: input.userId, role: input.role };
  });
}

/** Deactivate a teammate (soft delete): is_active=false. They keep their history but lose access. */
export async function deactivateUser(input: DeactivateUserInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [target] = await tx
      .select()
      .from(users)
      .where(and(eq(users.id, input.userId), eq(users.orgId, session.orgId)))
      .limit(1);
    if (!target) throw new AppError("NOT_FOUND", "User not found.");
    if (target.id === session.id) {
      throw new AppError("CONFLICT", "You can't deactivate yourself.");
    }
    if (!target.isActive) throw new AppError("CONFLICT", "User is already deactivated.");

    await tx
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(users.id, input.userId), eq(users.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "user.deactivated",
      entityType: "user",
      entityId: input.userId,
      diff: { before: { isActive: true }, after: { isActive: false } },
    });

    return { id: input.userId };
  });
}

/** Update a pipeline stage's label and/or SLA (org-scoped, keyed on the stage). */
export async function updateStageConfig(input: UpdateStageConfigInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(stageConfig)
      .where(and(eq(stageConfig.orgId, session.orgId), eq(stageConfig.stage, input.stage)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Stage config not found.");

    await tx
      .update(stageConfig)
      .set({
        ...(input.label !== undefined ? { label: input.label } : {}),
        ...(input.slaDays !== undefined ? { slaDays: input.slaDays } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(stageConfig.orgId, session.orgId), eq(stageConfig.stage, input.stage)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "stage_config.updated",
      entityType: "stage_config",
      entityId: existing.id,
      diff: { before: { label: existing.label, slaDays: existing.slaDays }, after: input },
    });

    return { stage: input.stage };
  });
}

/** Upsert the approval chain for a band (org-scoped, unique on org+band). */
export async function updateApprovalChain(input: UpdateApprovalChainInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(approvalChainConfig)
      .values({ orgId: session.orgId, band: input.band, chain: input.chain })
      .onConflictDoUpdate({
        target: [approvalChainConfig.orgId, approvalChainConfig.band],
        set: { chain: input.chain, updatedAt: new Date() },
      })
      .returning({ id: approvalChainConfig.id });

    if (!row) throw new AppError("INTERNAL", "Failed to save the approval chain.");

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "approval_chain.updated",
      entityType: "approval_chain_config",
      entityId: row.id,
      diff: { after: { band: input.band, chain: input.chain } },
    });

    return { id: row.id, band: input.band };
  });
}

/** Create a template (email / JD / offer). */
export async function createTemplate(input: CreateTemplateInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [tpl] = await tx
      .insert(templates)
      .values({
        orgId: session.orgId,
        name: input.name,
        kind: input.kind,
        subject: input.subject ?? null,
        body: input.body,
        variables: input.variables,
      })
      .returning({ id: templates.id });

    if (!tpl) throw new AppError("INTERNAL", "Failed to create template.");

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "template.created",
      entityType: "template",
      entityId: tpl.id,
      diff: { after: { name: input.name, kind: input.kind } },
    });

    return { id: tpl.id };
  });
}

/** Update a template's name / subject / body / variables (org-scoped). */
export async function updateTemplate(input: UpdateTemplateInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: templates.id })
      .from(templates)
      .where(and(eq(templates.id, input.id), eq(templates.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found.");

    await tx
      .update(templates)
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.subject !== undefined ? { subject: input.subject } : {}),
        ...(input.body !== undefined ? { body: input.body } : {}),
        ...(input.variables !== undefined ? { variables: input.variables } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(templates.id, input.id), eq(templates.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "template.updated",
      entityType: "template",
      entityId: input.id,
      diff: { changed: input },
    });

    return { id: input.id };
  });
}

/** Delete a template (org-scoped). */
export async function deleteTemplate(input: DeleteTemplateInput, session: SessionUser) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: templates.id, name: templates.name })
      .from(templates)
      .where(and(eq(templates.id, input.id), eq(templates.orgId, session.orgId)))
      .limit(1);
    if (!existing) throw new AppError("NOT_FOUND", "Template not found.");

    await tx
      .delete(templates)
      .where(and(eq(templates.id, input.id), eq(templates.orgId, session.orgId)));

    await insertAudit(tx, {
      orgId: session.orgId,
      actorId: session.id,
      action: "template.deleted",
      entityType: "template",
      entityId: input.id,
      diff: { before: { name: existing.name } },
    });

    return { id: input.id };
  });
}
