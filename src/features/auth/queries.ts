// server-only: resolves a Supabase auth user to our domain SessionUser (BACKEND-ARCHITECTURE.md §3.1).
import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { SessionUser } from "@/types/domain";

/** Join auth.users -> public.users on auth_user_id. Deactivated users resolve to null. */
export async function getUserByAuthId(authUserId: string): Promise<SessionUser | null> {
  const [row] = await db
    .select()
    .from(users)
    .where(and(eq(users.authUserId, authUserId), eq(users.isActive, true)))
    .limit(1);

  if (!row) return null;

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    title: row.title ?? "",
    initials: row.initials,
    tint: row.tint,
    orgId: row.orgId,
    authUserId: row.authUserId,
    isActive: row.isActive,
  };
}
