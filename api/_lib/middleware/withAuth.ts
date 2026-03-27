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
 * Passes the user's Id and email to the handler
 * 
 * Must be wrapped with `withErrorHandler` on the outside:
 * `withErrorHandler(withAuth(handler))`
 */
export function withAuth(handler: AuthenticatedApiHandler): ApiHandler {
  return async (req: Request) => {
    const cookieHeader = req.headers.get("Cookie") ?? ""
    const cookies = parseCookies(cookieHeader)
    const accessToken = cookies["access_token"]
    const refreshToken = cookies["refresh_token"]

    if (!accessToken && !refreshToken) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" })
    }

    // Try the access token first
    if (accessToken) {
      const { data, error } = await createUserClient().auth.getUser(accessToken)
      if (!error && data.user) {
        const authUser: AuthUser = { id: data.user.id, email: data.user.email!, accessToken }
        return handler(req, authUser)
      }
    }

    // Access token missing or invalid -> try refreshing
    if (!refreshToken) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" })
    }

    const { data: refreshData, error: refreshError } = await createUserClient().auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (refreshError || !refreshData.session || !refreshData.user) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" })
    }

    // if the refresh succeeds, ensure account expiry date is valid
    try {
      await assertAccountNotExpired(refreshData.user.id, {
        revokeAccessToken: refreshData.session.access_token,
      })
    } catch (error) {
      // if it is an account expired error, clear the cookies from client side
      if (error instanceof AppError && error.code === "ACCOUNT_EXPIRED") {
        const cookieHeaders: ResponseHeaders = clearAuthCookies().map((c) => ["Set-Cookie", c] as [string, string])
        return errorResponse(error.code, error.message, error.statusCode, cookieHeaders)
      }
      throw error
    }

    const cookieHeaders: ResponseHeaders = serializeAuthCookies(
      refreshData.session.access_token,
      refreshData.session.refresh_token,
    ).map((c) => ["Set-Cookie", c] as [string, string])

    const authUser: AuthUser = { id: refreshData.user.id, email: refreshData.user.email!, accessToken: refreshData.session.access_token }
    return handler(req, authUser, cookieHeaders)
  }
}
