import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { getAttempt, saveAttempt } from "../_lib/services/attemptService.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import {
  AttemptIdSchema,
  SaveAttemptRequestSchema,
  type GetAttemptResult,
} from "../../shared/schemas/attempt.schema.js"

// Maps to GET /api/attempts/<attempt_id>
export const GET = withErrorHandler(withAuth(async (request, authUser, cookieHeaders) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? ""
  const validatedId = parseOrThrow(AttemptIdSchema, id)
  const result: GetAttemptResult = await getAttempt(authUser.id, validatedId)
  return successResponse(result, 200, cookieHeaders)
}))

// Maps to PATCH /api/attempts/<attempt_id>
export const PATCH = withErrorHandler(withAuth(async (request, authUser, cookieHeaders) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? ""
  const validatedId = parseOrThrow(AttemptIdSchema, id)
  // extend request size to 50kb to expect full exam payloads
  const parsedBody = await parseJsonBody(request, 50 * 1024)
  const validatedInput = parseOrThrow(SaveAttemptRequestSchema, parsedBody)
  await saveAttempt(authUser.id, validatedId, validatedInput)
  return successResponse(null, 200, cookieHeaders)
}))
