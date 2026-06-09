// server-only: session helpers for RSC + server actions (BACKEND-ARCHITECTURE.md §3.1–3.3).
// Backed by Supabase Auth: the JWT is verified server-side via getUser(), then resolved to
// our domain SessionUser via Drizzle. The capability map is the authoritative gate.
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserByAuthId } from "@/features/auth/queries";
import { hasCapability, type Capability } from "@/lib/permissions";
import { AppError } from "@/lib/errors";
import type { SessionUser } from "@/types/domain";

/** Resolve the signed-in user from the verified Supabase session, or null. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser(); // verifies the JWT (not getSession())
  if (!user) return null;
  return getUserByAuthId(user.id);
}

/** Require a session; redirect to /login if there isn't one. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * The authoritative authorization gate (step 1 of the canonical write path). Throws
 * AppError('FORBIDDEN') on a denied capability — caught by `toResult` at the action
 * boundary and returned as `{ ok: false }`, never thrown across the client↔server line.
 */
export async function requireRole(cap: Capability): Promise<SessionUser> {
  const user = await requireSession();
  if (!hasCapability(user.role, cap)) {
    throw new AppError("FORBIDDEN", "You don't have permission to do that.");
  }
  return user;
}
