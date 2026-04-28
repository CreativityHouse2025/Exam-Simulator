import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { validateInsertAttempt } from "../_lib/validators/attemptValidators.js"
import { insertAttempt, listAttempts } from "../_lib/services/attemptService.js"
import type { InsertAttemptRequestBody, ListAttemptsResult } from "../_lib/types.js"

export const POST = withErrorHandler(withAuth(async (request, authUser) => {
  const parsedBody = await parseJsonBody(request)
  /* full exam input example: {
    exam_type: "full"
    exam_id: 1
    category_id: null
    question_ids: [1, 153, ..]
    choices_orders: [[4, 1, 2, 0], [3, 0, 1, 2], ...]
    duration_minutes: 230
  }
   */
  const validatedInput: InsertAttemptRequestBody = validateInsertAttempt(parsedBody)
  const result = await insertAttempt(authUser.id, validatedInput)
  return successResponse(result, 201)
}))

export const GET = withErrorHandler(withAuth(async (_request, authUser) => {
  const result: ListAttemptsResult = await listAttempts(authUser.id)
  return successResponse(result)
}))
