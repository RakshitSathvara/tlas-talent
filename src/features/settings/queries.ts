// server-only: Drizzle reads for the settings RSC pages (BACKEND-ARCHITECTURE.md §7.1–7.2).
// Every query is explicitly org-scoped (Drizzle bypasses RLS). The profile is the session
// user's own row; the roster is the org's users; pipeline config bundles stage_config +
// approval_chain_config; the audit log joins users for the actor name and pages newest-first.
import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  approvalChainConfig,
  auditLog,
  stageConfig,
  templates,
  users,
} from "@/lib/db/schema";
import { formatDate } from "@/lib/format";
import { pageInput, toOffset, type Paged } from "@/lib/pagination";
import type {
  ApprovalChainConfig,
  AuditEntry,
  SessionUser,
  StageConfig,
  Template,
  User,
} from "@/types/domain";

/** The signed-in user, for the profile page (already resolved from the session). */
export async function getProfile(session: SessionUser): Promise<User> {
  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    title: session.title,
    initials: session.initials,
    tint: session.tint,
  };
}

/** Everyone in the workspace, for the team roster (org-scoped, by name). */
export async function listUsers(orgId: string): Promise<User[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      title: users.title,
      initials: users.initials,
      tint: users.tint,
    })
    .from(users)
    .where(eq(users.orgId, orgId))
    .orderBy(users.name);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role,
    title: r.title ?? "",
    initials: r.initials,
    tint: r.tint,
  }));
}

/** Email / JD / offer templates, for the templates page (org-scoped, newest update first). */
export async function listTemplates(orgId: string): Promise<Template[]> {
  const rows = await db
    .select()
    .from(templates)
    .where(eq(templates.orgId, orgId))
    .orderBy(desc(templates.updatedAt));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    kind: r.kind,
    subject: r.subject ?? undefined,
    updatedOn: r.updatedAt.toISOString().slice(0, 10),
    variables: r.variables,
    body: r.body,
  }));
}

/** The stages (in sort order) and approval chains that drive the pipeline (org-scoped). */
export async function getPipelineConfig(
  orgId: string,
): Promise<{ stages: StageConfig[]; chains: ApprovalChainConfig[] }> {
  const [stageRows, chainRows] = await Promise.all([
    db
      .select()
      .from(stageConfig)
      .where(eq(stageConfig.orgId, orgId))
      .orderBy(stageConfig.sortOrder),
    db
      .select()
      .from(approvalChainConfig)
      .where(eq(approvalChainConfig.orgId, orgId))
      .orderBy(approvalChainConfig.band),
  ]);

  const stages: StageConfig[] = stageRows.map((r) => ({
    key: r.stage,
    label: r.label,
    slaDays: r.slaDays ?? 0,
    owner: r.owner,
  }));

  const chains: ApprovalChainConfig[] = chainRows.map((r) => ({
    band: r.band,
    chain: r.chain,
  }));

  return { stages, chains };
}

/**
 * The append-only audit trail, newest first, joined to users for the actor's display name.
 * Offset-paged via the shared pagination helper; returns a `Paged<AuditEntry>`.
 */
export async function getAuditLog(
  orgId: string,
  page: number = 1,
): Promise<Paged<AuditEntry>> {
  const p = pageInput.parse({ page });
  const { limit, offset } = toOffset(p);

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        id: auditLog.id,
        actorName: users.name,
        action: auditLog.action,
        entityType: auditLog.entityType,
        entityId: auditLog.entityId,
        at: auditLog.at,
      })
      .from(auditLog)
      .leftJoin(users, eq(users.id, auditLog.actorId))
      .where(eq(auditLog.orgId, orgId))
      .orderBy(desc(auditLog.at))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(auditLog)
      .where(eq(auditLog.orgId, orgId)),
  ]);

  const total = totalRow[0]?.value ?? 0;
  const entries: AuditEntry[] = rows.map((r) => ({
    id: r.id,
    actor: r.actorName ?? "System",
    action: r.action,
    entity: r.entityType,
    entityId: r.entityId,
    at: formatDate(r.at),
  }));

  return {
    rows: entries,
    total,
    page: p.page,
    pageSize: p.pageSize,
    pageCount: Math.ceil(total / p.pageSize),
  };
}
