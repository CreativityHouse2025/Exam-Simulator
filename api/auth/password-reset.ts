import { withAuth } from "../_lib/middleware/withAuth.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
export const GET = withErrorHandler(withAuth(async (_request: Request, authUser, cookieHeaders) => {
  return successResponse({ userId: authUser.id }, 200, cookieHeaders)
}))
