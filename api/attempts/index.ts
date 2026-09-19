import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { withRole } from "../_lib/middleware/withRole.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { StartAttemptRequestSchema, type StartedAttempt } from "../../shared/schemas/attempt.schema.js"
import { TrackIdSchema } from "../../shared/schemas/track.schema.js"
import { listAttempts, startAttempt } from "../_lib/services/attemptService.js"
import { getExam } from "../_lib/services/examService.js"
import { assertTrackAccess } from "../_lib/services/trackService.js"

// Maps to POST /api/attempts
export const POST = withErrorHandler(
  withAuth(
    withRole(["student"], async (request, authUser, cookieHeaders) => {
      // The body is { exam_id, lang } and nothing else — the server decides the rest.
      const parsedBody = await parseJsonBody(request)
      const validatedInput = parseOrThrow(StartAttemptRequestSchema, parsedBody)

      // Starting an exam is track access, unlike reading an attempt already owned. The track is
      // reachable only through the exam, so it is resolved before anything is written.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { config: _config, ...exam } = await getExam(validatedInput.exam_id)
      await assertTrackAccess(authUser.id, exam.track_id)

      const result: StartedAttempt = { ...(await startAttempt(authUser.id, validatedInput)), exam }
      return successResponse(result, 201, cookieHeaders)
    }),
  ),
)

// Maps to GET /api/attempts?trackId=<uuid>
// Ownership is the whole gate: the query is scoped to the caller's own id, so there is no role to
// check and nothing a role could widen.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    // Required: every screen that lists attempts is inside a track, and an unfiltered query would
    // silently drop a track's older attempts once the cap starts evicting.
    const trackId = new URL(request.url).searchParams.get("trackId") ?? ""
    const validatedTrackId = parseOrThrow(TrackIdSchema, trackId)

    const result = await listAttempts(authUser.id, validatedTrackId)
    return successResponse(result, 200, cookieHeaders)
  }),
)
