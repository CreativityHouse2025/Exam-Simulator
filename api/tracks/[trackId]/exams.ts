import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { TrackIdSchema } from "../../../shared/schemas/track.schema.js"
import type { TrackExams } from "../../../shared/schemas/exam.schema.js"
import { getTrackExams } from "../../_lib/services/examService.js"
import { assertTrackAccess } from "../../_lib/services/trackService.js"

// Maps to GET /api/tracks/<track_id>/exams
// Both roles reach this the same way: a supervisor enrols in a track exactly as a student does,
// and an expired enrollment is refused identically to never having had one.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    // Path is /api/tracks/<id>/exams — the id is the second-to-last segment.
    const trackId = parseOrThrow(TrackIdSchema, new URL(request.url).pathname.split("/").at(-2) ?? "")

    // Read alongside the access check: nothing is returned unless both succeed, so a refused caller
    // still gets the 403 and never the list.
    const [, result]: [void, TrackExams] = await Promise.all([
      assertTrackAccess(authUser.id, trackId),
      getTrackExams(trackId),
    ])
    return successResponse(result, 200, cookieHeaders)
  }),
)
