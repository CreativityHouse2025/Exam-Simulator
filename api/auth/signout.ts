import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseCookies, clearAuthCookies } from "../_lib/utils/cookies.js"
import { signout } from "../_lib/services/authService.js"
import { AppError } from "../_lib/errors/AppError.js"

export const POST = withErrorHandler(async (request: Request) => {
  const cookieHeader = request.headers.get("Cookie") ?? ""
  const cookies = parseCookies(cookieHeader)
  const accessToken = cookies["access_token"]

  if (!accessToken) {
    throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "No access token provided" })
  }

  await signout(accessToken)

  const cookieHeaders: [string, string][] = clearAuthCookies().map((c) => ["Set-Cookie", c])
  return successResponse(null, 200, cookieHeaders)
})
