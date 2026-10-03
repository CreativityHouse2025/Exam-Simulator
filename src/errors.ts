import type { AppErrorCode } from "@shared/api.schema";

/**
 * The feature a failure belongs to. The same code reads differently per domain — `NOT_FOUND` is
 * "attempt not found" or "student not found" — so the domain, not the code alone, selects the copy.
 * `api` covers cross-cutting failures raised by `apiFetch` itself (expired session, rate limit).
 */
export type DomainErrorCodes = {
  auth: Extract<
    AppErrorCode,
    | "INVALID_CREDENTIALS"
    | "ACCOUNT_EXPIRED"
    | "SUBSCRIPTION_REQUIRED"
    | "SIGNUP_FAILED"
    | "SIGNIN_FAILED"
    | "CONFIRMATION_FAILED"
    | "VALIDATION_ERROR"
  >;
  attempts: Extract<
    AppErrorCode,
    | "NOT_FOUND"
    | "FORBIDDEN"
    | "CONFLICT"
    | "ATTEMPT_CREATE_FAILED"
    | "ATTEMPT_SAVE_FAILED"
    | "ATTEMPT_SUBMIT_FAILED"
  >;
  students: Extract<AppErrorCode, "NOT_FOUND" | "FORBIDDEN">;
  exams: Extract<AppErrorCode, "NOT_FOUND" | "FORBIDDEN">;
  tracks: Extract<AppErrorCode, "FORBIDDEN">;
  api: Extract<AppErrorCode, "UNAUTHORIZED" | "RATE_LIMITED">;
};

export type ErrorDomain = keyof DomainErrorCodes;

/**
 * An API failure carrying only what identifies it: the error code and the domain that raised it.
 * Copy is resolved at render time by `resolveErrorKey` — the `message` is developer-facing only.
 */
export class AppApiError extends Error {
  constructor(
    public readonly code: AppErrorCode,
    public readonly domain: ErrorDomain,
  ) {
    super(`${domain}/${code}`);
    this.name = "AppApiError";
  }
}
