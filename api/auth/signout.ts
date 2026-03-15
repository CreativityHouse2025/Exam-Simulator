import { withAuth } from "../_lib/middleware/withAuth.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"

export const GET = withErrorHandler(withAuth(async (request: Request, userId: string) => {
  return successResponse({ userId, message: "Successfully passed an auth route" })
}))