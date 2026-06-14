import { AppApiError } from "../errors"
import { ApiError, AppErrorCode } from "../types"
import { translate } from "./translation"

let onUnauthorized: (() => Promise<void>) | null = null

const VERCEL_RATE_LIMIT_RESPONSE_STATUS = 429
const UNAUTHORIZED_RESPONSE_STATUS = 401

export interface RateLimitError extends Error {
  rateLimited: true
}

export type ApiFetchOptions = RequestInit & {
  handleUnauthorized: boolean
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof Error && "rateLimited" in error && (error as RateLimitError).rateLimited === true
}

export function registerUnauthorizedHandler(signoutFunction: () => Promise<void>) {
  onUnauthorized = signoutFunction
}

/**
 * Thin wrapper around fetch that intercepts Vercel 429 rate-limit responses and 401 unauthorized responses
 *
 * @param endpoint - The backend endpoint to be called
 * @param init - native `fetch` options plus an additional `handleUnauthorized` option that decides whether
 * to handle 401 errors internally or return the response to be handled in the caller (sign in, sign up)
 * @returns Response
 *
 * @throws { RateLimitError } - If the endpoint is rate limited for the user
 * @throws { AppApiError } - If the session is expired
 */
export async function apiFetch(endpoint: string, init: ApiFetchOptions): Promise<Response> {
  const { handleUnauthorized, ...fetchInit } = init
  const response = await fetch(endpoint, fetchInit)

  if (response.status === VERCEL_RATE_LIMIT_RESPONSE_STATUS) {
    const resetHeader = response.headers.get("X-RateLimit-Reset")
    let message: string
    if (resetHeader) {
      const resetTime = Number(resetHeader) * 1000
      const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60_000))
      message = translate("errors.rate-limited", [minutes])
    } else {
      message = translate("errors.rate-limited-generic")
    }
    const error = new Error(message) as RateLimitError
    error.rateLimited = true
    throw error
  } else if (onUnauthorized && handleUnauthorized && response.status === UNAUTHORIZED_RESPONSE_STATUS) {
    await onUnauthorized()
    let code: AppErrorCode = "UNAUTHORIZED"
    try {
      const result: ApiError = await response.json()
      code = result.error.code
    } catch {
      // absorb .json errors
    }
    throw new AppApiError(translate("errors.session-expired"), code)
  }

  return response
}
