// Feature input types inferred from the Zod schemas (BACKEND-ARCHITECTURE.md §4.2) — so the
// form, the action, and the service can never drift from the validation.
import type { z } from "zod";
import type {
  updateProfileSchema,
  inviteUserSchema,
  changeRoleSchema,
  deactivateUserSchema,
  updateStageConfigSchema,
  updateApprovalChainSchema,
  createTemplateSchema,
  updateTemplateSchema,
  deleteTemplateSchema,
} from "./schema";

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type DeactivateUserInput = z.infer<typeof deactivateUserSchema>;
export type UpdateStageConfigInput = z.infer<typeof updateStageConfigSchema>;
export type UpdateApprovalChainInput = z.infer<typeof updateApprovalChainSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type DeleteTemplateInput = z.infer<typeof deleteTemplateSchema>;
