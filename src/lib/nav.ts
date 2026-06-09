import type { Role } from "@/types/enums";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

// Primary navigation, gated by role (mirrors the route map, frontend-architecture.md §5.2).
export const PRIMARY_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["hr", "leadership", "interviewer", "admin"] },
  { href: "/requisitions", label: "Requisitions", roles: ["hr", "leadership", "admin"] },
  { href: "/candidates", label: "Candidates", roles: ["hr", "leadership", "admin"] },
  { href: "/pipeline", label: "Pipeline", roles: ["hr", "admin"] },
  { href: "/interviews", label: "Interviews", roles: ["hr", "interviewer", "admin"] },
  { href: "/offers", label: "Offers", roles: ["hr", "leadership", "admin"] },
  { href: "/approvals", label: "Approvals", roles: ["leadership", "admin"] },
  { href: "/reports", label: "Reports", roles: ["hr", "leadership", "admin"] },
];

export const navForRole = (role: Role): NavItem[] =>
  PRIMARY_NAV.filter((n) => n.roles.includes(role));
