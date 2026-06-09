"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

/**
 * Authenticate email + password against Supabase Auth (BACKEND-ARCHITECTURE.md §3.1). The
 * SSR client writes the session cookies; on success we redirect to the role-branched
 * dashboard. Returns a typed error for the form (adapted for useActionState). SSO providers
 * (Google/Microsoft) plug in here in production.
 */
export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password to sign in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "That email and password don't match an account." };
  }

  redirect("/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
