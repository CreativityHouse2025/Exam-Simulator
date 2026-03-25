import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { validatePasswordResetBody } from "../_lib/validators/authValidator.js"
import { requestPasswordReset } from "../_lib/services/authService.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body: unknown = await request.json()
  const { email } = validatePasswordResetBody(body)
  await requestPasswordReset(email)
  return successResponse(null, 200)
})
