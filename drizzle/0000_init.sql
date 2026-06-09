CREATE TYPE "public"."approval_state" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."approval_type" AS ENUM('requisition', 'offer');--> statement-breakpoint
CREATE TYPE "public"."interview_mode" AS ENUM('video', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."interview_status" AS ENUM('upcoming', 'pending_feedback', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."notification_kind" AS ENUM('approval', 'interview', 'offer', 'candidate', 'system');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('draft', 'pending_approval', 'approved', 'sent', 'accepted', 'declined', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."recommendation" AS ENUM('strong_yes', 'yes', 'maybe', 'no');--> statement-breakpoint
CREATE TYPE "public"."requisition_status" AS ENUM('open', 'pending_approval', 'filled', 'closed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('hr', 'leadership', 'interviewer', 'admin');--> statement-breakpoint
CREATE TYPE "public"."stage_key" AS ENUM('sourced', 'hr_review', 'tl_review', 'interview', 'offer', 'hired', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."template_kind" AS ENUM('email', 'jd', 'offer');--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" uuid,
	"verb" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"summary" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_chain_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"band" text NOT NULL,
	"chain" text[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approval_chain_band_unique" UNIQUE("org_id","band")
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"type" "approval_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"requester_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"amount" numeric(14, 2),
	"raised_at" timestamp with time zone DEFAULT now() NOT NULL,
	"state" "approval_state" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"approval_request_id" uuid NOT NULL,
	"step_order" integer NOT NULL,
	"role" text NOT NULL,
	"approver_id" uuid,
	"state" "approval_state" DEFAULT 'pending' NOT NULL,
	"acted_on" timestamp with time zone,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approval_steps_order_unique" UNIQUE("approval_request_id","step_order"),
	CONSTRAINT "approval_steps_order_check" CHECK (step_order > 0)
);
--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"diff" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"stage" "stage_key" NOT NULL,
	"entered_on" timestamp with time zone DEFAULT now() NOT NULL,
	"note" text,
	"changed_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"requisition_id" uuid,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"stage" "stage_key" DEFAULT 'sourced' NOT NULL,
	"experience" text,
	"location" text,
	"email" text NOT NULL,
	"phone" text,
	"source" text,
	"applied_on" timestamp with time zone DEFAULT now() NOT NULL,
	"expected_ctc" numeric(14, 2),
	"expected_ctc_display" text,
	"notice_period" text,
	"summary" text,
	"initials" text NOT NULL,
	"tint" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"interview_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"interviewer_id" uuid NOT NULL,
	"round" integer NOT NULL,
	"rating_technical" smallint NOT NULL,
	"rating_communication" smallint NOT NULL,
	"rating_role_fit" smallint NOT NULL,
	"rating_cultural" smallint NOT NULL,
	"recommendation" "recommendation" NOT NULL,
	"notes" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_one_per_interviewer" UNIQUE("interview_id","interviewer_id"),
	CONSTRAINT "feedback_round_check" CHECK (round > 0),
	CONSTRAINT "feedback_rating_technical_check" CHECK (rating_technical between 1 and 5),
	CONSTRAINT "feedback_rating_communication_check" CHECK (rating_communication between 1 and 5),
	CONSTRAINT "feedback_rating_role_fit_check" CHECK (rating_role_fit between 1 and 5),
	CONSTRAINT "feedback_rating_cultural_check" CHECK (rating_cultural between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"storage_bucket" text NOT NULL,
	"storage_path" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "files_storage_unique" UNIQUE("storage_bucket","storage_path"),
	CONSTRAINT "files_size_check" CHECK (size_bytes >= 0)
);
--> statement-breakpoint
CREATE TABLE "interview_panelists" (
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"org_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_panelists_interview_id_user_id_pk" PRIMARY KEY("interview_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"requisition_id" uuid,
	"scheduled_at" timestamp with time zone NOT NULL,
	"round" integer DEFAULT 1 NOT NULL,
	"duration_minutes" integer DEFAULT 60 NOT NULL,
	"mode" "interview_mode" DEFAULT 'video' NOT NULL,
	"status" "interview_status" DEFAULT 'upcoming' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interviews_round_check" CHECK (round > 0),
	CONSTRAINT "interviews_duration_check" CHECK (duration_minutes > 0)
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"kind" "notification_kind" NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"href" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"requisition_id" uuid,
	"status" "offer_status" DEFAULT 'draft' NOT NULL,
	"terms_band" text,
	"terms_ctc" numeric(14, 2),
	"terms_location" text,
	"terms_joining_date" date,
	"terms_type" text,
	"created_on" timestamp with time zone DEFAULT now() NOT NULL,
	"pdf_file_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requisitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" text NOT NULL,
	"team" text NOT NULL,
	"location" text NOT NULL,
	"openings" integer DEFAULT 1 NOT NULL,
	"status" "requisition_status" DEFAULT 'open' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"band" text,
	"band_min" numeric(14, 2),
	"band_max" numeric(14, 2),
	"raised_by" uuid NOT NULL,
	"raised_on" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requisitions_openings_check" CHECK (openings > 0),
	CONSTRAINT "requisitions_band_order" CHECK (band_max is null or band_min is null or band_max >= band_min)
);
--> statement-breakpoint
CREATE TABLE "stage_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"stage" "stage_key" NOT NULL,
	"label" text NOT NULL,
	"sla_days" integer,
	"owner" "role" NOT NULL,
	"sort_order" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stage_config_stage_unique" UNIQUE("org_id","stage"),
	CONSTRAINT "stage_config_sla_check" CHECK (sla_days is null or sla_days >= 0)
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"name" text NOT NULL,
	"kind" "template_kind" NOT NULL,
	"subject" text,
	"body" text NOT NULL,
	"variables" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"auth_user_id" uuid,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "role" NOT NULL,
	"title" text,
	"initials" text NOT NULL,
	"tint" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "users_email_org_unique" UNIQUE("org_id","email")
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_chain_config" ADD CONSTRAINT "approval_chain_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approval_request_id_approval_requests_id_fk" FOREIGN KEY ("approval_request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_approver_id_users_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_stage_history" ADD CONSTRAINT "candidate_stage_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_interviewer_id_users_id_fk" FOREIGN KEY ("interviewer_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_panelists" ADD CONSTRAINT "interview_panelists_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_panelists" ADD CONSTRAINT "interview_panelists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_panelists" ADD CONSTRAINT "interview_panelists_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_requisition_id_requisitions_id_fk" FOREIGN KEY ("requisition_id") REFERENCES "public"."requisitions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_pdf_file_id_files_id_fk" FOREIGN KEY ("pdf_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requisitions" ADD CONSTRAINT "requisitions_raised_by_users_id_fk" FOREIGN KEY ("raised_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stage_config" ADD CONSTRAINT "stage_config_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_org_time_idx" ON "activities" USING btree ("org_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "activities_target_idx" ON "activities" USING btree ("target_type","target_id");--> statement-breakpoint
CREATE INDEX "approval_chain_config_org_idx" ON "approval_chain_config" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approval_requests_org_idx" ON "approval_requests" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approval_requests_org_state_idx" ON "approval_requests" USING btree ("org_id","state");--> statement-breakpoint
CREATE INDEX "approval_requests_entity_idx" ON "approval_requests" USING btree ("type","entity_id");--> statement-breakpoint
CREATE INDEX "approval_requests_requester_idx" ON "approval_requests" USING btree ("requester_id");--> statement-breakpoint
CREATE INDEX "approval_steps_request_idx" ON "approval_steps" USING btree ("approval_request_id","step_order");--> statement-breakpoint
CREATE INDEX "approval_steps_org_idx" ON "approval_steps" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "approval_steps_approver_idx" ON "approval_steps" USING btree ("approver_id");--> statement-breakpoint
CREATE INDEX "audit_log_org_at_idx" ON "audit_log" USING btree ("org_id","at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_actor_idx" ON "audit_log" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "csh_org_idx" ON "candidate_stage_history" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "csh_candidate_time_idx" ON "candidate_stage_history" USING btree ("candidate_id","entered_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "candidates_org_idx" ON "candidates" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "candidates_org_stage_idx" ON "candidates" USING btree ("org_id","stage");--> statement-breakpoint
CREATE INDEX "candidates_requisition_idx" ON "candidates" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "candidates_org_source_idx" ON "candidates" USING btree ("org_id","source");--> statement-breakpoint
CREATE INDEX "feedback_org_idx" ON "feedback" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "feedback_interview_idx" ON "feedback" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "feedback_candidate_idx" ON "feedback" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "feedback_interviewer_idx" ON "feedback" USING btree ("interviewer_id");--> statement-breakpoint
CREATE INDEX "files_org_idx" ON "files" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "files_entity_idx" ON "files" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "interview_panelists_user_idx" ON "interview_panelists" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "interview_panelists_org_idx" ON "interview_panelists" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "interviews_org_idx" ON "interviews" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "interviews_candidate_idx" ON "interviews" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "interviews_org_status_idx" ON "interviews" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "interviews_org_scheduled_idx" ON "interviews" USING btree ("org_id","scheduled_at");--> statement-breakpoint
CREATE INDEX "notifications_recipient_unread_idx" ON "notifications" USING btree ("recipient_id","created_at" DESC NULLS LAST) WHERE not is_read;--> statement-breakpoint
CREATE INDEX "notifications_recipient_idx" ON "notifications" USING btree ("recipient_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "notifications_org_idx" ON "notifications" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "offers_org_idx" ON "offers" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "offers_org_status_idx" ON "offers" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "offers_candidate_idx" ON "offers" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "offers_requisition_idx" ON "offers" USING btree ("requisition_id");--> statement-breakpoint
CREATE INDEX "requisitions_org_idx" ON "requisitions" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "requisitions_org_status_idx" ON "requisitions" USING btree ("org_id","status");--> statement-breakpoint
CREATE INDEX "requisitions_raised_by_idx" ON "requisitions" USING btree ("raised_by");--> statement-breakpoint
CREATE INDEX "stage_config_org_order_idx" ON "stage_config" USING btree ("org_id","sort_order");--> statement-breakpoint
CREATE INDEX "templates_org_kind_idx" ON "templates" USING btree ("org_id","kind");--> statement-breakpoint
CREATE INDEX "users_org_idx" ON "users" USING btree ("org_id");--> statement-breakpoint
CREATE INDEX "users_org_role_idx" ON "users" USING btree ("org_id","role");--> statement-breakpoint
CREATE INDEX "users_auth_user_idx" ON "users" USING btree ("auth_user_id");