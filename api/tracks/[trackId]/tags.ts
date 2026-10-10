import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { TrackIdSchema } from "../../../shared/schemas/track.schema.js"
import type { TrackTags } from "../../../shared/schemas/exam.schema.js"
import { assertTrackAccess, getTrackTags } from "../../_lib/services/trackService.js"

// Maps to GET /api/tracks/<track_id>/tags
// Same gate as /exams: both roles, enrollment decides.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    // Path is /api/tracks/<id>/tags — the id is the second-to-last segment.
    const trackId = parseOrThrow(TrackIdSchema, new URL(request.url).pathname.split("/").at(-2) ?? "")

    await assertTrackAccess(authUser.id, trackId)

    const result: TrackTags = await getTrackTags(trackId)
    return successResponse(result, 200, cookieHeaders)
  }),
)
