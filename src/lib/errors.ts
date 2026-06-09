// Error model (BACKEND-ARCHITECTURE.md §4.2). A single AppError carries a stable code, a
// user-safe message, and optional fieldErrors; `toResult` converts it to the canonical Result.
import { ZodError } from "zod";
import { log } from "@/lib/log";
import type { Result } from "@/types/result";

export const ERROR_CODES = [
  "UNAUTHENTICATED", // no valid session
  "FORBIDDEN", // session exists, capability denied
  "VALIDATION", // Zod parse failed (carries fieldErrors)
  "NOT_FOUND", // row missing or out of caller's org scope
  "CONFLICT", // version conflict or duplicate (e.g. mergeDuplicate)
  "STAGE_GATE", // advanceStage blocked: panel feedback for the round incomplete
  "APPROVAL_STATE", // illegal approval transition / out-of-order step
  "RATE_LIMITED", // too many attempts
  "INTERNAL", // unexpected; log + opaque message to client
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

const flatten = (e: ZodError): Record<string, string> =>
  Object.fromEntries(
    Object.entries(e.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? "Invalid"]),
  );

/** Wrap an action body: AppError -> Result, ZodError -> VALIDATION, anything else -> INTERNAL (logged). */
export async function toResult<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return { ok: true, data: await fn() };
  } catch (e) {
    if (e instanceof ZodError) {
      return { ok: false, code: "VALIDATION", error: "Invalid input", fieldErrors: flatten(e) };
    }
    if (e instanceof AppError) {
      return { ok: false, code: e.code, error: e.message, fieldErrors: e.fieldErrors };
    }
    log.error("unhandled action error", { err: e instanceof Error ? e.message : String(e) });
    return { ok: false, code: "INTERNAL", error: "Something went wrong. Please retry." };
  }
}
