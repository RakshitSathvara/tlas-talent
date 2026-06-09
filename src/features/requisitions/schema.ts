// Zod boundary schemas for requisitions (BACKEND-ARCHITECTURE.md §8). The single source of
// truth for anything crossing client↔server — the form and the action share these, and the
// action's input type is `z.infer<...>` (re-exported from types.ts).
import { z } from "zod";

export const createRequisitionFields = z.object({
  title: z.string().min(1),
  team: z.string().min(1),
  location: z.string().min(1),
  openings: z.number().int().positive(),
  priority: z.enum(["high", "medium", "low"]),
  band: z.string().min(1),
  bandMin: z.number().nonnegative(),
  bandMax: z.number().nonnegative(),
  description: z.string(),
});

export const createRequisitionSchema = createRequisitionFields.refine(
  (d) => d.bandMax >= d.bandMin,
  { message: "Max band must be greater than or equal to min band", path: ["bandMax"] },
);

export const editRequisitionSchema = createRequisitionFields
  .partial()
  .extend({ id: z.string().uuid() });

export const updateNotesSchema = z.object({
  id: z.string().uuid(),
  description: z.string(),
});

export const closeRequisitionSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().optional(),
});
