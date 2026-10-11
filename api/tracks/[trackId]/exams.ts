import { z } from "zod"
import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { TrackIdSchema } from "../../../shared/schemas/track.schema.js"
import type { ExamList } from "../../../shared/schemas/exam.schema.js"
import { getTrackExams } from "../../_lib/services/examService.js"
import { assertTrackAccess } from "../../_lib/services/trackService.js"

// Not the tag-code regex: a malformed code is an unknown tag (404), not a bad request.
const TagCodeSchema = z.string().min(1)

// Maps to GET /api/tracks/<track_id>/exams?tag=<code>
// Both roles reach this the same way: a supervisor enrols in a track exactly as a student does,
// and an expired enrollment is refused identically to never having had one.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const url = new URL(request.url)
    // Path is /api/tracks/<id>/exams — the id is the second-to-last segment.
    const trackId = parseOrThrow(TrackIdSchema, url.pathname.split("/").at(-2) ?? "")
    const tagCode = parseOrThrow(TagCodeSchema, url.searchParams.get("tag"))

    await assertTrackAccess(authUser.id, trackId)

    const result: ExamList = await getTrackExams(trackId, tagCode, authUser.id)
    return successResponse(result, 200, cookieHeaders)
  }),
)
