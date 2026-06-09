// The shared client↔server result contract (BACKEND-ARCHITECTURE.md §4.2).
// Server actions return this and NEVER throw for expected failures; client components
// import it to discriminate on an action's return value.
import type { ErrorCode } from "@/lib/errors";

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: ErrorCode; fieldErrors?: Record<string, string> };
