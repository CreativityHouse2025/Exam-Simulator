import { translate } from "./translation"

export interface RateLimitError extends Error {
  rateLimited: true
}

export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof Error && "rateLimited" in error && (error as RateLimitError).rateLimited === true
}

/**
 * Thin wrapper around fetch that intercepts Vercel 429 rate-limit responses
 * and throws a localized error with the retry time.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init)

  if (response.status === 429) {
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
  }

  return response
}
