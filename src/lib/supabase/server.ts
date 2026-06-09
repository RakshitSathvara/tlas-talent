// Cookie-bound Supabase client for RSC + Server Actions (BACKEND-ARCHITECTURE.md §3.1).
// Carries the user's session (anon key + user JWT). Used for Auth only — relational data
// goes through Drizzle. `getUser()` (not `getSession()`) verifies the JWT server-side.
import "server-only";
import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet: CookieToSet[]) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component (cookies are read-only there); the middleware
            // refreshes the session cookies instead. Safe to ignore.
          }
        },
      },
    },
  );
}
