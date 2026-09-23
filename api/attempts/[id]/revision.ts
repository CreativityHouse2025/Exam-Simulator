import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { AttemptIdSchema, type Revision } from "../../../shared/schemas/attempt.schema.js"
import { LangSchema } from "../../../shared/schemas/exam.schema.js"
import { getRevision } from "../../_lib/services/attemptService.js"

// Maps to GET /api/attempts/<attempt_id>/revision?lang=<ar|en>
// An empty question set is a normal 200: "nothing left to revise" is an outcome, not an error.
export const GET = withErrorHandler(
  withAuth(async (request, authUser, cookieHeaders) => {
    const url = new URL(request.url)
    // Path is /api/attempts/<id>/revision — the id is the second-to-last segment.
    const attemptId = parseOrThrow(AttemptIdSchema, url.pathname.split("/").at(-2) ?? "")
    const lang = parseOrThrow(LangSchema, url.searchParams.get("lang") ?? "")

    const result: Revision = await getRevision(authUser.id, attemptId, lang)
    return successResponse(result, 200, cookieHeaders)
  }),
)
