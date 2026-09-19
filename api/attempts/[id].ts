import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../_lib/middleware/withAuth.js"
import { successResponse } from "../_lib/utils/response.js"
import { parseJsonBody } from "../_lib/utils/parseBody.js"
import { getAttempt, saveAttempt } from "../_lib/services/attemptService.js"
import { parseOrThrow } from "../_lib/utils/parse.js"
import { AttemptIdSchema, SaveAttemptRequestSchema } from "../../shared/schemas/attempt.schema.js"
import { LangSchema } from "../../shared/schemas/exam.schema.js"

/** The attempt id is the last path segment. */
function attemptIdOf(request: Request): string {
  return parseOrThrow(AttemptIdSchema, new URL(request.url).pathname.split("/").pop() ?? "")
}

// Maps to GET /api/attempts/<attempt_id>?lang=<ar|en>
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const attemptId = attemptIdOf(request)
    // Content is single-language. A missing lang is a caller bug, not a reason to guess one.
    const lang = parseOrThrow(LangSchema, new URL(request.url).searchParams.get("lang") ?? "")

    const result = await getAttempt(authUser.id, attemptId, lang)
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
