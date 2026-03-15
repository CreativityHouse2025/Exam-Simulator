import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { serializeAuthCookies } from "../_lib/utils/cookies.js"
import { validateSigninBody } from "../_lib/validators/authValidator.js"
import { signin } from "../_lib/services/authService.js"
import { SigninResult } from "../_lib/types.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body: unknown = await request.json()
  const { email, password } = validateSigninBody(body)
  const result: SigninResult = await signin({ email, password })
  const cookieHeaders = serializeAuthCookies(result.access_token, result.refresh_token)

  return successResponse({ user: result.user }, 200, cookieHeaders.map((c) => ["Set-Cookie", c]))
})
