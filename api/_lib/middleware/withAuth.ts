import type { ApiHandler, AuthenticatedApiHandler, AuthUser, ResponseHeaders } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { createUserClient } from "../supabaseClient.js"
import { assertAccountNotExpired } from "../services/authService.js"
import { parseCookies, serializeAuthCookies, clearAuthCookies } from "../utils/cookies.js"
import { errorResponse } from "../utils/response.js"

/**
 * Middleware that validates auth tokens from cookies before calling the handler.
 * If the access token is expired but a refresh token exists, it refreshes the session
 * and sets updated cookies on the response.
 *
 * Bypass mode: set BYPASS_AUTH=true in your .env.local to skip token validation entirely.
 * When bypassed, BYPASS_AUTH_USER_ID must also be set to a valid user UUID.
 * NEVER set BYPASS_AUTH in a production environment.
 *
 * Must be wrapped with `withErrorHandler` on the outside:
 * `withErrorHandler(withAuth(handler))`
 */
export function withAuth(handler: AuthenticatedApiHandler): ApiHandler {
  return async (req: Request) => {
    if (process.env.BYPASS_AUTH === "true") {
      const userId = process.env.BYPASS_AUTH_USER_ID
      if (!userId) throw new AppError({ statusCode: 500, code: "INTERNAL_ERROR", message: "BYPASS_AUTH is enabled but BYPASS_AUTH_USER_ID is not set" })
      return handler(req, { id: userId, email: "bypass@local.dev", accessToken: "bypass" })
    }

    const cookieHeader = req.headers.get("Cookie") ?? ""
    const cookies = parseCookies(cookieHeader)
    const accessToken = cookies["access_token"]
    const refreshToken = cookies["refresh_token"]

    if (!accessToken && !refreshToken) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required (no tokens)" })
    }

    // Try the access token first — getClaims verifies the JWT signature locally
    // using a cached JWKS (asymmetric keys), with no GoTrue network call after cold start.
    if (accessToken) {
      // note: getClaims throws instead of returning an error if JWT is invalid, should handle internally
      try {
        const { data, error } = await createUserClient().auth.getClaims(accessToken)
        if (!error && data) {
          const authUser: AuthUser = { id: data.claims.sub!, email: data.claims.email!, accessToken }
          return handler(req, authUser)
        }
      } catch {
        // Fall through to the refresh path for all getClaims failures.
        // Throwing early here would reject users whose access token expired with a non-standard
        // error message, or whose getClaims call failed transiently (e.g. JWKS fetch on cold start).
        // If the refresh token is also invalid, refreshSession below will fail and clear the cookies.
      }
    }

    // Access token missing (expired or cleared in browser)
    if (!refreshToken) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required (no refresh token)" })
    }

    const { data: refreshData, error: refreshError } = await createUserClient().auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (refreshError || !refreshData.session || !refreshData.user) {
      // The refresh token is dead — likely revoked by a force-signin, password update, or account expiry
      // from another session. Clear the cookies so the browser stops retrying with the same dead token,
      // which would produce a refresh_token_not_found loop in Supabase on every subsequent request.
      const expiredCookieHeaders: ResponseHeaders = clearAuthCookies().map((c) => ["Set-Cookie", c] as [string, string])
      return errorResponse("UNAUTHORIZED", "Authentication required (refresh token invalid)", 401, expiredCookieHeaders)
    }

    // if the refresh succeeds, ensure account expiry date is valid
    try {
      await assertAccountNotExpired(refreshData.user.id, {
        revokeAccessToken: refreshData.session.access_token,
      })
    } catch (error) {
      // Clear cookies for any failure here — the refresh token was already consumed by refreshSession
      // above, so the client has no valid credentials regardless of the error type.
      const expiredCookieHeaders: ResponseHeaders = clearAuthCookies().map((c) => ["Set-Cookie", c] as [string, string])
      if (error instanceof AppError) {
        return errorResponse(error.code, error.message, error.statusCode, expiredCookieHeaders)
      }
      return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500, expiredCookieHeaders)
    }

    const cookieHeaders: ResponseHeaders = serializeAuthCookies(
      refreshData.session.access_token,
      refreshData.session.refresh_token,
    ).map((c) => ["Set-Cookie", c] as [string, string])

    const authUser: AuthUser = { id: refreshData.user.id, email: refreshData.user.email!, accessToken: refreshData.session.access_token }
    // don't propagate error to the error handler
    // edge case: session refreshed but an error occured in the handler, withErrorHandler doesn't send cookies
    // sends cookies no matter what happens
    try {
      return await handler(req, authUser, cookieHeaders)
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(error.code, error.message, error.statusCode, cookieHeaders)
      }
      return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500, cookieHeaders)
    }
  }
}
