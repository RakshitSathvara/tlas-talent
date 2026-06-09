// Demo sign-in metadata for the login screen (BACKEND-ARCHITECTURE.md §3.1). Authentication
// itself is Supabase Auth (see features/auth/actions.ts); these are just the one-account-per-role
// demo logins surfaced on the form. The seed (scripts/seed.ts) creates matching Supabase Auth
// users with this shared password. Replace with SSO in production.
export const DEMO_PASSWORD = "atlas1234";

/** Shown on the login screen so every role can be tried. One account per role. */
export const DEMO_ACCOUNTS: { email: string; role: string; label: string }[] = [
  { email: "priya@tmsystems.in", role: "HR", label: "Priya Shah · Head of Talent" },
  { email: "rakshit@tmsystems.in", role: "Leadership", label: "Rakshit Patel · Chief Executive" },
  { email: "meghna@tmsystems.in", role: "Interviewer", label: "Meghna Iyer · Senior Engineer" },
  { email: "sara@tmsystems.in", role: "Admin", label: "Sara Khan · Workspace Admin" },
];
