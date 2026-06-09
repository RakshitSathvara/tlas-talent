import type { AuditEntry } from "@/types/domain";

// Append-only activity (frontend-architecture.md §12.5). Read-only by definition.
export const auditLog: AuditEntry[] = [
  { id: "au1", actor: "Rakshit Patel", action: "offer.approved", entity: "Offer", entityId: "o4", at: "2026-05-24 16:42" },
  { id: "au2", actor: "Priya Shah", action: "candidate.advanced", entity: "Candidate", entityId: "c1", at: "2026-05-29 09:18" },
  { id: "au3", actor: "Karan Joshi", action: "feedback.submitted", entity: "Interview", entityId: "i2", at: "2026-05-29 06:30" },
  { id: "au4", actor: "Priya Shah", action: "interview.scheduled", entity: "Interview", entityId: "i3", at: "2026-05-28 11:05" },
  { id: "au5", actor: "Aarav Nair", action: "requisition.approved", entity: "Requisition", entityId: "r2", at: "2026-05-21 10:12" },
  { id: "au6", actor: "Sara Khan", action: "user.role_changed", entity: "User", entityId: "u6", at: "2026-05-20 15:44" },
  { id: "au7", actor: "System", action: "sla.breached", entity: "Candidate", entityId: "c2", at: "2026-05-29 00:00" },
  { id: "au8", actor: "Priya Shah", action: "offer.drafted", entity: "Offer", entityId: "o3", at: "2026-05-29 08:55" },
  { id: "au9", actor: "Rakshit Patel", action: "requisition.created", entity: "Requisition", entityId: "r5", at: "2026-05-27 14:20" },
  { id: "au10", actor: "Meera Nair", action: "offer.accepted", entity: "Offer", entityId: "o2", at: "2026-05-13 09:02" },
];
