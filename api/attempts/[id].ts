import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { getAttempt } from "../_lib/services/attemptService.js"
import type { GetAttemptResult } from "../_lib/types.js"

// Maps to GET /api/attempts/<attempt_id>
export const GET = withErrorHandler(withAuth(async (request, authUser) => {
  const id = new URL(request.url).pathname.split("/").pop() ?? ""
  const result: GetAttemptResult = await getAttempt(authUser.id, id)
  return successResponse(result)
}))
