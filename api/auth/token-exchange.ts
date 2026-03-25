import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { serializeAuthCookies } from "../_lib/utils/cookies.js"
import { validateTokenExchangeBody } from "../_lib/validators/authValidator.js"
import { confirmMagicLinkSignin } from "../_lib/services/authService.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body: unknown = await request.json()
  const { access_token, refresh_token } = validateTokenExchangeBody(body)
  const result = await confirmMagicLinkSignin(access_token, refresh_token)
  const cookieHeaders = serializeAuthCookies(result.access_token, result.refresh_token)

  return successResponse({ user: result.user }, 200, cookieHeaders.map((c) => ["Set-Cookie", c]))
})
