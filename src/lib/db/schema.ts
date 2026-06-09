// The single source of truth for the relational schema (BACKEND-ARCHITECTURE.md §5).
// snake_case columns <-> camelCase fields. `drizzle-kit generate` diffs THIS file into the
// SQL migration, so schema and DDL cannot drift. Things Drizzle's column API can't express
// (the auth.users FK on users.auth_user_id, trigram GIN indexes, RLS, triggers, the access
// token hook, reporting views) live in raw SQL under supabase/migrations/ (§6).
import { sql } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  integer,
  smallint,
  bigint,
  numeric,
  date,
  jsonb,
  index,
  unique,
  primaryKey,
  check,
} from "drizzle-orm/pg-core";

/* ───────────────────────────── Enums (§5.2) ───────────────────────────── */

export const roleEnum = pgEnum("role", ["hr", "leadership", "interviewer", "admin"]);
export const stageKeyEnum = pgEnum("stage_key", [
  "sourced",
  "hr_review",
  "tl_review",
  "interview",
  "offer",
  "hired",
  "rejected",
]);
export const approvalStateEnum = pgEnum("approval_state", ["pending", "approved", "rejected"]);
export const recommendationEnum = pgEnum("recommendation", ["strong_yes", "yes", "maybe", "no"]);
export const priorityEnum = pgEnum("priority", ["high", "medium", "low"]);
export const requisitionStatusEnum = pgEnum("requisition_status", [
  "open",
  "pending_approval",
  "filled",
  "closed",
]);
// 'today' is DERIVED at read time (scheduled_at::date = current_date), never stored.
export const interviewStatusEnum = pgEnum("interview_status", [
  "upcoming",
  "pending_feedback",
  "completed",
  "cancelled",
]);
export const interviewModeEnum = pgEnum("interview_mode", ["video", "in_person"]);
export const offerStatusEnum = pgEnum("offer_status", [
  "draft",
  "pending_approval",
  "approved",
  "sent",
  "accepted",
  "declined",
  "withdrawn",
]);
export const notificationKindEnum = pgEnum("notification_kind", [
  "approval",
  "interview",
  "offer",
  "candidate",
  "system",
]);
export const templateKindEnum = pgEnum("template_kind", ["email", "jd", "offer"]);
export const approvalTypeEnum = pgEnum("approval_type", ["requisition", "offer"]);

/* ───────────────────────────── Identity & org ───────────────────────────── */

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    // 1:1 link to Supabase Auth. The FK to auth.users is added in a raw SQL migration.
    authUserId: uuid("auth_user_id").unique(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    role: roleEnum("role").notNull(),
    title: text("title"),
    initials: text("initials").notNull(),
    tint: text("tint").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("users_email_org_unique").on(t.orgId, t.email),
    index("users_org_idx").on(t.orgId),
    index("users_org_role_idx").on(t.orgId, t.role),
    index("users_auth_user_idx").on(t.authUserId),
  ],
);

/* ───────────────────────────── Requisitions ───────────────────────────── */

export const requisitions = pgTable(
  "requisitions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    team: text("team").notNull(),
    location: text("location").notNull(),
    openings: integer("openings").notNull().default(1),
    status: requisitionStatusEnum("status").notNull().default("open"),
    priority: priorityEnum("priority").notNull().default("medium"),
    band: text("band"), // display string, e.g. '₹24–30L'
    bandMin: numeric("band_min", { precision: 14, scale: 2 }),
    bandMax: numeric("band_max", { precision: 14, scale: 2 }),
    raisedBy: uuid("raised_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    raisedOn: timestamp("raised_on", { withTimezone: true }).notNull().defaultNow(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("requisitions_org_idx").on(t.orgId),
    index("requisitions_org_status_idx").on(t.orgId, t.status),
    index("requisitions_raised_by_idx").on(t.raisedBy),
    check("requisitions_openings_check", sql`openings > 0`),
    check("requisitions_band_order", sql`band_max is null or band_min is null or band_max >= band_min`),
  ],
);

/* ───────────────────────── Candidates & stage history ───────────────────────── */

export const candidates = pgTable(
  "candidates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id").references(() => requisitions.id, {
      onDelete: "set null",
    }),
    name: text("name").notNull(),
    role: text("role").notNull(), // target role title (denormalized at apply time)
    stage: stageKeyEnum("stage").notNull().default("sourced"), // mirror of latest history row
    experience: text("experience"),
    location: text("location"),
    email: text("email").notNull(),
    phone: text("phone"),
    source: text("source"),
    appliedOn: timestamp("applied_on", { withTimezone: true }).notNull().defaultNow(),
    expectedCtc: numeric("expected_ctc", { precision: 14, scale: 2 }),
    expectedCtcDisplay: text("expected_ctc_display"),
    noticePeriod: text("notice_period"),
    summary: text("summary"),
    initials: text("initials").notNull(),
    tint: text("tint").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("candidates_org_idx").on(t.orgId),
    index("candidates_org_stage_idx").on(t.orgId, t.stage),
    index("candidates_requisition_idx").on(t.requisitionId),
    index("candidates_org_source_idx").on(t.orgId, t.source),
  ],
);

export const candidateStageHistory = pgTable(
  "candidate_stage_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    stage: stageKeyEnum("stage").notNull(),
    enteredOn: timestamp("entered_on", { withTimezone: true }).notNull().defaultNow(),
    note: text("note"),
    changedBy: uuid("changed_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // append-only: no updated_at
  },
  (t) => [
    index("csh_org_idx").on(t.orgId),
    index("csh_candidate_time_idx").on(t.candidateId, t.enteredOn.desc()),
  ],
);

/* ───────────────────────── Interviews, panel & feedback ───────────────────────── */

export const interviews = pgTable(
  "interviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id").references(() => requisitions.id, {
      onDelete: "set null",
    }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
    round: integer("round").notNull().default(1),
    durationMinutes: integer("duration_minutes").notNull().default(60),
    mode: interviewModeEnum("mode").notNull().default("video"),
    status: interviewStatusEnum("status").notNull().default("upcoming"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("interviews_org_idx").on(t.orgId),
    index("interviews_candidate_idx").on(t.candidateId),
    index("interviews_org_status_idx").on(t.orgId, t.status),
    index("interviews_org_scheduled_idx").on(t.orgId, t.scheduledAt),
    check("interviews_round_check", sql`round > 0`),
    check("interviews_duration_check", sql`duration_minutes > 0`),
  ],
);

export const interviewPanelists = pgTable(
  "interview_panelists",
  {
    interviewId: uuid("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.interviewId, t.userId] }),
    index("interview_panelists_user_idx").on(t.userId),
    index("interview_panelists_org_idx").on(t.orgId),
  ],
);

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    interviewId: uuid("interview_id")
      .notNull()
      .references(() => interviews.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    interviewerId: uuid("interviewer_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    round: integer("round").notNull(),
    ratingTechnical: smallint("rating_technical").notNull(),
    ratingCommunication: smallint("rating_communication").notNull(),
    ratingRoleFit: smallint("rating_role_fit").notNull(),
    ratingCultural: smallint("rating_cultural").notNull(),
    recommendation: recommendationEnum("recommendation").notNull(),
    notes: text("notes"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("feedback_one_per_interviewer").on(t.interviewId, t.interviewerId),
    index("feedback_org_idx").on(t.orgId),
    index("feedback_interview_idx").on(t.interviewId),
    index("feedback_candidate_idx").on(t.candidateId),
    index("feedback_interviewer_idx").on(t.interviewerId),
    check("feedback_round_check", sql`round > 0`),
    check("feedback_rating_technical_check", sql`rating_technical between 1 and 5`),
    check("feedback_rating_communication_check", sql`rating_communication between 1 and 5`),
    check("feedback_rating_role_fit_check", sql`rating_role_fit between 1 and 5`),
    check("feedback_rating_cultural_check", sql`rating_cultural between 1 and 5`),
  ],
);

/* ───────────────────────────── Files ───────────────────────────── */
// Defined before offers because offers.pdf_file_id references files. The reverse link
// (files.entity_id -> offer/candidate) is polymorphic and carries NO db FK.

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(), // 'candidate' (resume) | 'offer' (pdf)
    entityId: uuid("entity_id").notNull(), // polymorphic; service-enforced
    storageBucket: text("storage_bucket").notNull(), // 'resumes' | 'offers'
    storagePath: text("storage_path").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("files_storage_unique").on(t.storageBucket, t.storagePath),
    index("files_org_idx").on(t.orgId),
    index("files_entity_idx").on(t.entityType, t.entityId),
    check("files_size_check", sql`size_bytes >= 0`),
  ],
);

/* ───────────────────────────── Offers ───────────────────────────── */

export const offers = pgTable(
  "offers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    requisitionId: uuid("requisition_id").references(() => requisitions.id, {
      onDelete: "set null",
    }),
    status: offerStatusEnum("status").notNull().default("draft"),
    termsBand: text("terms_band"),
    termsCtc: numeric("terms_ctc", { precision: 14, scale: 2 }),
    termsLocation: text("terms_location"),
    termsJoiningDate: date("terms_joining_date"),
    termsType: text("terms_type"),
    createdOn: timestamp("created_on", { withTimezone: true }).notNull().defaultNow(),
    pdfFileId: uuid("pdf_file_id").references(() => files.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("offers_org_idx").on(t.orgId),
    index("offers_org_status_idx").on(t.orgId, t.status),
    index("offers_candidate_idx").on(t.candidateId),
    index("offers_requisition_idx").on(t.requisitionId),
  ],
);

/* ───────────────────────────── Approvals ───────────────────────────── */

export const approvalRequests = pgTable(
  "approval_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    type: approvalTypeEnum("type").notNull(),
    entityId: uuid("entity_id").notNull(), // polymorphic: requisitions.id OR offers.id (no FK)
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    amount: numeric("amount", { precision: 14, scale: 2 }),
    raisedAt: timestamp("raised_at", { withTimezone: true }).notNull().defaultNow(),
    state: approvalStateEnum("state").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("approval_requests_org_idx").on(t.orgId),
    index("approval_requests_org_state_idx").on(t.orgId, t.state),
    index("approval_requests_entity_idx").on(t.type, t.entityId),
    index("approval_requests_requester_idx").on(t.requesterId),
  ],
);

export const approvalSteps = pgTable(
  "approval_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    approvalRequestId: uuid("approval_request_id")
      .notNull()
      .references(() => approvalRequests.id, { onDelete: "cascade" }),
    stepOrder: integer("step_order").notNull(),
    role: text("role").notNull(), // chain label, e.g. 'TL' / 'HR' / 'CEO'
    approverId: uuid("approver_id").references(() => users.id, { onDelete: "set null" }),
    state: approvalStateEnum("state").notNull().default("pending"),
    actedOn: timestamp("acted_on", { withTimezone: true }),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("approval_steps_order_unique").on(t.approvalRequestId, t.stepOrder),
    index("approval_steps_request_idx").on(t.approvalRequestId, t.stepOrder),
    index("approval_steps_org_idx").on(t.orgId),
    index("approval_steps_approver_idx").on(t.approverId),
    check("approval_steps_order_check", sql`step_order > 0`),
  ],
);

/* ───────────────────── Activity, notifications & audit ───────────────────── */

export const activities = pgTable(
  "activities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    verb: text("verb").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(), // polymorphic; no FK
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    summary: text("summary").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // append-only feed: no updated_at
  },
  (t) => [
    index("activities_org_time_idx").on(t.orgId, t.occurredAt.desc()),
    index("activities_target_idx").on(t.targetType, t.targetId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    recipientId: uuid("recipient_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: notificationKindEnum("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("notifications_recipient_unread_idx")
      .on(t.recipientId, t.createdAt.desc())
      .where(sql`not is_read`),
    index("notifications_recipient_idx").on(t.recipientId, t.createdAt.desc()),
    index("notifications_org_idx").on(t.orgId),
  ],
);

export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(), // polymorphic; no FK
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    diff: jsonb("diff"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // append-only: no updated_at
  },
  (t) => [
    index("audit_log_org_at_idx").on(t.orgId, t.at.desc()),
    index("audit_log_entity_idx").on(t.entityType, t.entityId),
    index("audit_log_actor_idx").on(t.actorId),
  ],
);

/* ───────────────────────────── Templates & config ───────────────────────────── */

export const templates = pgTable(
  "templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: templateKindEnum("kind").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    variables: text("variables").array().notNull().default(sql`'{}'`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("templates_org_kind_idx").on(t.orgId, t.kind)],
);

export const stageConfig = pgTable(
  "stage_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    stage: stageKeyEnum("stage").notNull(),
    label: text("label").notNull(),
    slaDays: integer("sla_days"),
    owner: roleEnum("owner").notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("stage_config_stage_unique").on(t.orgId, t.stage),
    index("stage_config_org_order_idx").on(t.orgId, t.sortOrder),
    check("stage_config_sla_check", sql`sla_days is null or sla_days >= 0`),
  ],
);

export const approvalChainConfig = pgTable(
  "approval_chain_config",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    band: text("band").notNull(),
    chain: text("chain").array().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("approval_chain_band_unique").on(t.orgId, t.band),
    index("approval_chain_config_org_idx").on(t.orgId),
  ],
);

/* ───────────────────────────── Inferred row types ───────────────────────────── */

export type OrganizationRow = typeof organizations.$inferSelect;
export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
export type RequisitionRow = typeof requisitions.$inferSelect;
export type NewRequisitionRow = typeof requisitions.$inferInsert;
export type CandidateRow = typeof candidates.$inferSelect;
export type NewCandidateRow = typeof candidates.$inferInsert;
export type OfferRow = typeof offers.$inferSelect;
export type ApprovalRequestRow = typeof approvalRequests.$inferSelect;
export type ApprovalStepRow = typeof approvalSteps.$inferSelect;
