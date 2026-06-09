"use client";

import { useSessionUser } from "@/components/layout/session-provider";
import { hasCapability, type Capability } from "@/lib/permissions";

/**
 * The active role + a capability check, read from the signed-in session. Role is fixed by
 * login (no more demo switching); `can()` drives role-conditional UI (frontend-architecture.md §8.2).
 */
export function useRole() {
  const user = useSessionUser();
  return {
    role: user.role,
    user,
    can: (cap: Capability) => hasCapability(user.role, cap),
  };
}
