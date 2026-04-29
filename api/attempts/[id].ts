import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { getAttempt, saveAttempt } from "../_lib/services/attemptService.js"
import { validateAttemptId, validateSaveAttempt } from "../_lib/validators/attemptValidators.js"
import type { GetAttemptResult } from "../_lib/types.js"

// Maps to GET /api/attempts/<attempt_id>
export const GET = withErrorHandler(withAuth(async (request, authUser) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? ""
  const validatedId = validateAttemptId(id)
  const result: GetAttemptResult = await getAttempt(authUser.id, validatedId)
  return successResponse(result)
}))

// Maps to PATCH /api/attempts/<attempt_id>
export const PATCH = withErrorHandler(withAuth(async (request, authUser) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? ""
  const validatedId = validateAttemptId(id)
  const parsedBody = await parseJsonBody(request)
  const validatedInput = validateSaveAttempt(parsedBody)
  await saveAttempt(authUser.id, validatedId, validatedInput)
  return successResponse({})
}))
