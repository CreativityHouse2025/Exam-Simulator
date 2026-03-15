import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { validateSignupBody } from "../_lib/validators/authValidator.js"
import { signup, SignupResult } from "../_lib/services/authService.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body: unknown = await request.json()
  const { email, password, first_name, last_name } = validateSignupBody(body)
  const result: SignupResult = await signup({ email, password, first_name, last_name })
  return successResponse(result, 201)
})
