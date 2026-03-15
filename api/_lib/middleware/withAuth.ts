import type { ApiHandler, AuthenticatedApiHandler } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { supabaseClient } from "../supabaseClient.js"
import { parseCookies, serializeAuthCookies } from "../utils/cookies.js"

/**
 * Middleware that validates auth tokens from cookies before calling the handler.
 * If the access token is expired but a refresh token exists, it refreshes the session
 * and sets updated cookies on the response.
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
      const { data, error } = await supabaseClient.auth.getUser(accessToken)
      if (!error && data.user) {
        return handler(req, data.user.id)
      }
    }

    // Access token missing or invalid -> try refreshing
    if (!refreshToken) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" })
    }

    const { data: refreshData, error: refreshError } = await supabaseClient.auth.refreshSession({
      refresh_token: refreshToken,
    })

    if (refreshError || !refreshData.session || !refreshData.user) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "Authentication required" })
    }

    // Execute handler to get response and append the new cookies header
    const response = await handler(req, refreshData.user.id)
    const newCookies = serializeAuthCookies(refreshData.session.access_token, refreshData.session.refresh_token)

    for (const cookie of newCookies) {
      response.headers.append("Set-Cookie", cookie)
    }

    return response
  }
}
