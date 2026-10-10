import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { getAttempt, saveAttempt } from "../_lib/services/attemptService.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { z } from "zod"
import { AttemptIdSchema, SaveAttemptAnswersSchema, type AttemptWithQuestions } from "../../shared/schemas/attempt.schema.js"

/**
 * In-progress state only. `score` and `status` are undeclared on purpose: with `strictObject` a
 * client that tries to send either gets a 400. Grading lives behind submit and nowhere else.
 */
const SaveAttemptRequestSchema = z.strictObject({
  current_index: z.int().nonnegative(),
  /** Null exactly when the attempt is untimed; the RPC refuses a payload that disagrees with its
   * config snapshot (`invalid_time`). */
  time_remaining: z.int().nonnegative().nullable(),
  answers: SaveAttemptAnswersSchema,
  /** `show_at_index` values offered since the last save. `offered_at` is stamped by the server. */
  offered_breaks: z.array(z.int().nonnegative()).default([]),
})

/** The attempt id is the last path segment. */
function attemptIdOf(request: Request): string {
  return parseOrThrow(AttemptIdSchema, new URL(request.url).pathname.split("/").pop() ?? "")
}

// Maps to GET /api/attempts/<attempt_id>
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const attemptId = attemptIdOf(request)

    const result: AttemptWithQuestions = await getAttempt(authUser.id, attemptId)
    return successResponse(result, 200, cookieHeaders)
  }),
)

// Maps to PATCH /api/attempts/<attempt_id>
export const PATCH = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const attemptId = attemptIdOf(request)
    // The answers array is a diff of dirty questions, not a full exam: now that content and
    // choice order stay server-side, even an autosave touching every question is a few KB.
    const parsedBody = await parseJsonBody(request, 16 * 1024)
    const validatedInput = parseOrThrow(SaveAttemptRequestSchema, parsedBody)

    await saveAttempt(authUser.id, attemptId, validatedInput)
    return successResponse(null, 200, cookieHeaders)
  }),
)
