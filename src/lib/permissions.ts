import type { Role } from "@/types/enums";

/**
 * The single capability map (BACKEND-ARCHITECTURE.md §3.3). Checks read as intentions, not
 * role strings. Imported client-side to *hide* UI and server-side (via `requireRole`) to
 * *refuse* — the server check is the only real gate; UI hiding is cosmetic.
 */
export const capabilities = {
  createRequisition: ["leadership", "admin"],
  approveRequisition: ["leadership", "admin"],
  approveOffer: ["leadership", "admin"],
  manageCandidates: ["hr", "admin"],
  uploadResume: ["hr", "admin"],
  scheduleInterview: ["hr", "admin"],
  submitFeedback: ["interviewer", "hr", "leadership", "admin"],
  draftOffer: ["hr", "admin"],
  viewReports: ["hr", "leadership", "admin"],
  manageUsers: ["admin"],
  manageTemplates: ["hr", "admin"],
  viewAuditLog: ["admin"],
  viewApprovals: ["leadership", "admin"],
  viewPipeline: ["hr", "admin"],
} as const satisfies Record<string, readonly Role[]>;

export type Capability = keyof typeof capabilities;

/** `can.X` reads as an intention at call sites (its value is the capability key itself). */
export const can = (Object.keys(capabilities) as Capability[]).reduce(
  (acc, k) => ({ ...acc, [k]: k }),
  {} as Record<Capability, Capability>,
);

export function hasCapability(role: Role | null, cap: Capability): boolean {
  return !!role && (capabilities[cap] as readonly Role[]).includes(role);
}

/**
 * Coarse route→role gating used by the middleware (BACKEND-ARCHITECTURE.md §3.3). Longest
 * matching prefix wins; routes not listed are open to any authenticated user. This is
 * convenience-only — every read/write still re-checks server-side.
 */
const ROUTE_GUARDS: { prefix: string; roles: Role[] }[] = [
  { prefix: "/requisitions/new", roles: ["leadership", "admin"] },
  { prefix: "/requisitions", roles: ["hr", "leadership", "admin"] },
  { prefix: "/candidates", roles: ["hr", "leadership", "admin"] },
  { prefix: "/pipeline", roles: ["hr", "admin"] },
  { prefix: "/interviews", roles: ["hr", "interviewer", "admin"] },
  { prefix: "/offers", roles: ["hr", "leadership", "admin"] },
  { prefix: "/approvals", roles: ["leadership", "admin"] },
  { prefix: "/reports", roles: ["hr", "leadership", "admin"] },
  { prefix: "/settings/team", roles: ["admin"] },
  { prefix: "/settings/templates", roles: ["hr", "admin"] },
  { prefix: "/settings/pipeline-config", roles: ["admin"] },
  { prefix: "/settings/audit-log", roles: ["admin"] },
];

export function routeAccess(role: Role | null, pathname: string): boolean {
  let match: { prefix: string; roles: Role[] } | null = null;
  for (const g of ROUTE_GUARDS) {
    if (pathname === g.prefix || pathname.startsWith(`${g.prefix}/`)) {
      if (!match || g.prefix.length > match.prefix.length) match = g;
    }
  }
  if (!match) return true; // unguarded route — any authenticated user
  return !!role && match.roles.includes(role);
}
