import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { PasswordResetRequestSchema } from "../../shared/schemas/auth.schema.js"
import { requestPasswordReset } from "../_lib/services/authService.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body = await parseJsonBody(request)
  const { email } = parseOrThrow(PasswordResetRequestSchema, body)
  await requestPasswordReset(email)
  return successResponse(null, 200)
})
