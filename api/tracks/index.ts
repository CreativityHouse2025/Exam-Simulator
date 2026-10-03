import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import type { TrackList } from "../../shared/schemas/track.schema.js"
import { listTracks } from "../_lib/services/trackService.js"

// Maps to GET /api/tracks
// The whole catalogue, to any authenticated caller and with no enrollment filter: a track's name
// and description are what a student reads to decide whether to enrol. Which of them the caller
// can actually open comes from /api/auth/me, and merging the two is the frontend's job.
export const GET = withErrorHandler(
  withAuth(async (_request, _authUser, cookieHeaders) => {
    const tracks = await listTracks()
    const result: TrackList = { tracks }

    return successResponse(result, 200, cookieHeaders)
  }),
)
