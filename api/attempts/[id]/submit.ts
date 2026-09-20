import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseJsonBody } from "../../_lib/utils/parseBody.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { AttemptIdSchema, SubmitAttemptRequestSchema } from "../../../shared/schemas/attempt.schema.js"
import { submitAttempt } from "../../_lib/services/attemptService.js"

// Maps to POST /api/attempts/<attempt_id>/submit
// Ownership is the gate, and the service enforces it: grading someone else's attempt is refused
// by the RPC, not by a role check here.
//
// Grades the attempt and stores the result (score, status, wrong_questions) — it does not return
// it. The client reads the grade back with GET /api/attempts/<attempt_id>, same as a resume.
export const POST = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    // Path is /api/attempts/<id>/submit — the id is the second-to-last segment.
    const url = new URL(request.url)
    const attemptId = parseOrThrow(AttemptIdSchema, url.pathname.split("/").at(-2) ?? "")

    // The final answer diff travels with the submission so the last answers and the grading share
    // one transaction.
    const parsedBody = await parseJsonBody(request, 16 * 1024)
    const validatedInput = parseOrThrow(SubmitAttemptRequestSchema, parsedBody)

    await submitAttempt(authUser.id, attemptId, validatedInput)
    return successResponse(null, 200, cookieHeaders)
  }),
)
