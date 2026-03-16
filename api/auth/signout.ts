import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseCookies, clearAuthCookies } from "../_lib/utils/cookies.js"
import { signout } from "../_lib/services/authService.js"

export const POST = withErrorHandler(async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie") ?? ""
  const cookies = parseCookies(cookieHeader)

  await signout({ accessToken: cookies["access_token"], refreshToken: cookies["refresh_token"] })
  console.warn("[/api/signout/]: User signed out")

  const cookieHeaders: [string, string][] = clearAuthCookies().map((c) => ["Set-Cookie", c])
  return successResponse(null, 200, cookieHeaders)
})
