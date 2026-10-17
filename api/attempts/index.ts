import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { withRole } from "../_lib/middleware/withRole.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { z } from "zod"
import { AttemptPageSchema, type AttemptList, type AttemptWithQuestions } from "../../shared/schemas/attempt.schema.js"
import { TrackIdSchema } from "../../shared/schemas/track.schema.js"
import { listAttempts, startAttempt } from "../_lib/services/attemptService.js"

/** The client sends only which exam. The server decides the question set, the order, the config and the clock. */
const StartAttemptRequestSchema = z.strictObject({
  exam_id: z.int().positive(),
})

// Maps to POST /api/attempts
export const POST = withErrorHandler(
  withAuth(
    withRole(["student"], async (request, authUser, cookieHeaders) => {
      // The body is { exam_id } and nothing else — the server decides the rest.
      const parsedBody = await parseJsonBody(request)
      const validatedInput = parseOrThrow(StartAttemptRequestSchema, parsedBody)

      const result: AttemptWithQuestions = await startAttempt(authUser.id, validatedInput.exam_id)
      return successResponse(result, 201, cookieHeaders)
    }),
  ),
)

// Maps to GET /api/attempts?trackId=<uuid>&page=<n>&per_page=<n>
// Ownership is the whole gate: the query is scoped to the caller's own id, so there is no role to
// check and nothing a role could widen.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const { searchParams } = new URL(request.url)
    // Required: every screen that lists attempts is inside a track.
    const validatedTrackId = parseOrThrow(TrackIdSchema, searchParams.get("trackId") ?? "")
    // An absent param is undefined, not null, so its default applies.
    const page = parseOrThrow(AttemptPageSchema, {
      page: searchParams.get("page") ?? undefined,
      per_page: searchParams.get("per_page") ?? undefined,
    })

    const result: AttemptList = await listAttempts(authUser.id, validatedTrackId, page)
    return successResponse(result, 200, cookieHeaders)
  }),
)
