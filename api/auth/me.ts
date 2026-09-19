import { withAuth } from "../_lib/middleware/withAuth.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import type { UserWithTracks } from "../../shared/schemas/user.schema.js"
import { getUserWithTracks } from "../_lib/services/userService.js"

// Maps to GET /api/auth/me
// The caller's own profile and the tracks they may currently open. The track catalogue itself
// comes from /api/tracks; merging the two is the frontend's job.
//
// The email is handed over rather than looked up: withAuth already verified it off the JWT, so the
// whole response costs one query.
export const GET = withErrorHandler(
  withAuth(async (_request, authUser, cookieHeaders) => {
    const result: UserWithTracks = await getUserWithTracks(authUser.id, authUser.email)
    return successResponse(result, 200, cookieHeaders)
  }),
)
