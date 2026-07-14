import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { withRole } from "../_lib/middleware/withRole.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { validateInsertAttempt } from "../_lib/validators/attemptValidators.js"
import { insertAttempt, listAttempts } from "../_lib/services/attemptService.js"
import type { InsertAttemptRequestBody, ListAttemptsResult } from "../_lib/types.js"

// Maps to POST /api/attempts
export const POST = withErrorHandler(withAuth(withRole(["student"], async (request, authUser, cookieHeaders) => {
  const parsedBody = await parseJsonBody(request, 50 * 1024)
  const validatedInput: InsertAttemptRequestBody = validateInsertAttempt(parsedBody)
  const result = await insertAttempt(authUser.id, validatedInput)
  return successResponse(result, 201, cookieHeaders)
})))

// Maps to GET /api/attempts
export const GET = withErrorHandler(withAuth(withRole(["student"], async (_request, authUser, cookieHeaders) => {
  const result: ListAttemptsResult = await listAttempts(authUser.id)
  return successResponse(result, 200, cookieHeaders)
})))
