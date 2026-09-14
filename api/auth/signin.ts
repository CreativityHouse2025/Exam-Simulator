import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { serializeAuthCookies } from "../_lib/utils/cookies.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { SigninRequestSchema, type SigninResult } from "../../shared/schemas/auth.schema.js"
import { signin } from "../_lib/services/authService.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body = await parseJsonBody(request)
  const { email, password, force } = parseOrThrow(SigninRequestSchema, body)
  const result: SigninResult = await signin({ email, password, force })  
  const cookieHeaders = serializeAuthCookies(result.access_token, result.refresh_token)

  return successResponse({ user: result.user }, 200, cookieHeaders.map((c) => ["Set-Cookie", c]))
})
