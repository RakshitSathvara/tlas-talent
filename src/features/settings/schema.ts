// Zod boundary schemas for settings / admin writes (BACKEND-ARCHITECTURE.md §8). The single
// source of truth for anything crossing client↔server — the form and the action share these,
// and the action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

const roleSchema = z.enum(["hr", "leadership", "interviewer", "admin"]);
const stageKeySchema = z.enum([
  "sourced",
  "hr_review",
  "tl_review",
  "interview",
  "offer",
  "hired",
  "rejected",
]);
const templateKindSchema = z.enum(["email", "jd", "offer"]);

/* ── Profile (self-service: own name/title) ── */
export const updateProfileSchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
});

/* ── Users (admin) ── */
export const inviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  role: roleSchema,
  title: z.string().optional(),
});

export const changeRoleSchema = z.object({
  userId: z.string().uuid(),
  role: roleSchema,
});

export const deactivateUserSchema = z.object({
  userId: z.string().uuid(),
});

/* ── Pipeline config (admin) ── */
export const updateStageConfigSchema = z.object({
  stage: stageKeySchema,
  label: z.string().min(1).optional(),
  slaDays: z.number().int().nonnegative().nullable().optional(),
});

export const updateApprovalChainSchema = z.object({
  band: z.string().min(1),
  chain: z.array(z.string().min(1)),
});

/* ── Templates (manageTemplates) ── */
export const createTemplateSchema = z.object({
  name: z.string().min(1),
  kind: templateKindSchema,
  subject: z.string().optional(),
  body: z.string().min(1),
  variables: z.array(z.string()).default([]),
});

export const updateTemplateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).optional(),
  subject: z.string().optional(),
  body: z.string().min(1).optional(),
  variables: z.array(z.string()).optional(),
});

export const deleteTemplateSchema = z.object({
  id: z.string().uuid(),
});
