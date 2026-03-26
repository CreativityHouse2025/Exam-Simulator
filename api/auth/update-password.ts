import { withAuth } from "../_lib/middleware/withAuth.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { validateUpdatePasswordBody } from "../_lib/validators/authValidator.js"
import { updatePassword } from "../_lib/services/authService.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"

export const POST = withErrorHandler(
  withAuth(async (request: Request, authUser, cookieHeaders) => {
    const body = await parseJsonBody(request)
    const { password } = validateUpdatePasswordBody(body)
    await updatePassword(authUser.id, password)
    return successResponse(null, 200, cookieHeaders)
  }),
)
