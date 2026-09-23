import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { SignupRequestSchema } from "../../shared/schemas/auth.schema.js"
import { signup, SignupResult } from "../_lib/services/authService.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body = await parseJsonBody(request)
  const { email, password, first_name, last_name } = parseOrThrow(SignupRequestSchema, body)
  const result: SignupResult = await signup({ email, password, first_name, last_name })
  return successResponse(result, 201)
})
