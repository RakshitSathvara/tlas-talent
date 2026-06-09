// Domain unions (frontend-architecture.md §9). One source of truth, imported everywhere.

export type Role = "hr" | "leadership" | "interviewer" | "admin";

export type StageKey =
  | "sourced"
  | "hr_review"
  | "tl_review"
  | "interview"
  | "offer"
  | "hired"
  | "rejected";

export type ApprovalState = "pending" | "approved" | "rejected";

export type Recommendation = "strong_yes" | "yes" | "maybe" | "no";

export type Priority = "high" | "medium" | "low";

export type RequisitionStatus = "open" | "pending_approval" | "filled" | "closed";

export type InterviewStatus = "upcoming" | "today" | "pending_feedback" | "completed";

export type InterviewMode = "video" | "in_person";

export type OfferStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent"
  | "accepted"
  | "declined"
  | "withdrawn";

export type NotificationKind = "approval" | "interview" | "offer" | "candidate" | "system";

export type TemplateKind = "email" | "jd" | "offer";

export type ApprovalType = "requisition" | "offer";
