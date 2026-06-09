// Domain entities (frontend-architecture.md §9). The reference implementation's
// interfaces are promoted here and extended with the IDs/timestamps a real record carries.
import type {
  ApprovalState,
  ApprovalType,
  InterviewMode,
  InterviewStatus,
  NotificationKind,
  OfferStatus,
  Priority,
  Recommendation,
  RequisitionStatus,
  Role,
  StageKey,
  TemplateKind,
} from "./enums";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  initials: string;
  /** Muted earth-tone avatar background (design-system.md §2.5). */
  tint: string;
}

/**
 * The session user resolved server-side (BACKEND-ARCHITECTURE.md §3.1): the domain `User`
 * plus the tenancy + auth-link fields a wired backend carries. Returned by
 * `getSessionUser` / `requireSession` / `requireRole`; assignable to `User` everywhere
 * the UI only needs the display fields.
 */
export interface SessionUser extends User {
  orgId: string;
  authUserId: string | null;
  isActive: boolean;
}

export interface Candidate {
  id: string;
  name: string;
  /** The role they're being considered for. */
  role: string;
  requisitionId: string;
  stage: StageKey;
  experience: string;
  location: string;
  email: string;
  phone: string;
  source: string;
  daysInStage: number;
  appliedOn: string;
  initials: string;
  tint: string;
  expectedCtc?: string;
  noticePeriod?: string;
  summary?: string;
}

export interface StageEvent {
  stage: StageKey;
  enteredOn: string;
  note?: string;
  /** True for the candidate's current stage. */
  current?: boolean;
}

export interface Requisition {
  id: string;
  title: string;
  team: string;
  location: string;
  openings: number;
  filled: number;
  daysOpen: number;
  pipeline: number;
  status: RequisitionStatus;
  priority: Priority;
  band: string;
  raisedBy: string;
  raisedOn: string;
  description?: string;
}

export interface ApprovalStep {
  role: string;
  name: string;
  state: ApprovalState;
  actedOn?: string;
}

export interface Approval {
  id: string;
  type: ApprovalType;
  /** The thing being approved — role title or candidate name. */
  title: string;
  subtitle: string;
  requester: string;
  raised: string;
  amount?: string;
  entityId: string;
}

export interface Interview {
  id: string;
  candidateId: string;
  candidate: string;
  role: string;
  requisitionId: string;
  time: string;
  date: string;
  round: string;
  duration: string;
  mode: InterviewMode;
  status: InterviewStatus;
  panel: string[];
  initials: string;
  tint: string;
}

export interface FeedbackRatings {
  technical: number;
  communication: number;
  roleFit: number;
  cultural: number;
}

export interface Feedback {
  id: string;
  interviewId: string;
  candidateId: string;
  interviewer: string;
  round: string;
  ratings: FeedbackRatings;
  recommendation: Recommendation;
  notes: string;
  submittedOn: string;
}

export interface OfferTerms {
  band: string;
  ctc: string;
  location: string;
  joiningDate: string;
  type: string;
}

export interface Offer {
  id: string;
  candidateId: string;
  candidate: string;
  role: string;
  requisitionId: string;
  status: OfferStatus;
  terms: OfferTerms;
  createdOn: string;
  initials: string;
  tint: string;
  approvalChain: ApprovalStep[];
}

export interface Activity {
  id: string;
  who: string;
  what: string;
  target: string;
  when: string;
}

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  when: string;
  read: boolean;
  href: string;
}

export interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  at: string;
}

export interface Template {
  id: string;
  name: string;
  kind: TemplateKind;
  subject?: string;
  updatedOn: string;
  variables: string[];
  body: string;
}

export interface StageConfig {
  key: StageKey;
  label: string;
  slaDays: number;
  owner: Role;
}

export interface ApprovalChainConfig {
  band: string;
  chain: string[];
}

/** Aggregated funnel datum used by the reports + leadership dashboard charts. */
export interface FunnelStage {
  label: string;
  value: number;
  color: string;
}
