import { AppApiError } from "../errors"
import type { DomainErrorCodes, ErrorDomain } from "../errors"
import type { AppErrorCode } from "@shared/api.schema"

const UNKNOWN_ERROR_KEY = "errors.unknown"

type ErrorDomainEntry<D extends ErrorDomain> = {
  /** Codes whose copy is specific to this domain. Every declared code must be mapped. */
  codes: Record<DomainErrorCodes[D], string>
  /** Used for any code the domain does not declare — the server can return codes a domain never anticipated. */
  fallback: string
}

const ERROR_DOMAINS: { [D in ErrorDomain]: ErrorDomainEntry<D> } = {
  auth: {
    codes: {
      INVALID_CREDENTIALS: "auth.errors.server-invalid-credentials",
      ACCOUNT_EXPIRED: "auth.errors.server-account-expired",
      SUBSCRIPTION_REQUIRED: "auth.errors.server-subscription-required",
      SIGNUP_FAILED: "auth.errors.server-signup-failed",
      SIGNIN_FAILED: "auth.errors.server-signin-failed",
      CONFIRMATION_FAILED: "auth.errors.server-confirmation-failed",
      VALIDATION_ERROR: "auth.errors.server-validation-error",
      SESSION_CONFLICT: "auth.errors.server-session-conflict",
    },
    fallback: "auth.errors.server-unknown",
  },
  attempts: {
    codes: {
      NOT_FOUND: "attempts.errors.server-not-found",
      FORBIDDEN: "attempts.errors.server-forbidden",
      CONFLICT: "attempts.errors.server-conflict",
      ATTEMPT_CREATE_FAILED: "attempts.errors.server-create-failed",
      ATTEMPT_SAVE_FAILED: "attempts.errors.server-save-failed",
    },
    fallback: "attempts.errors.server-unknown",
  },
  students: {
    codes: {
      NOT_FOUND: "students.errors.server-not-found",
      FORBIDDEN: "students.errors.server-forbidden",
    },
    fallback: "students.errors.server-unknown",
  },
  api: {
    codes: {
      UNAUTHORIZED: "errors.session-expired",
      RATE_LIMITED: "errors.rate-limited-generic",
    },
    fallback: UNKNOWN_ERROR_KEY,
  },
}

/**
 * Resolves any caught value to a translation key. Callers pass the key straight to `showToast`
 * (or to `translate` for inline rendering) — copy is never resolved at throw time, so a language
 * switch between the failure and the render still produces the right text.
 */
export function resolveErrorKey(error: unknown): string {
  if (!(error instanceof AppApiError)) return UNKNOWN_ERROR_KEY

  const { codes, fallback } = ERROR_DOMAINS[error.domain]
  const keysByCode: Partial<Record<AppErrorCode, string>> = codes
  return keysByCode[error.code] ?? fallback
}
