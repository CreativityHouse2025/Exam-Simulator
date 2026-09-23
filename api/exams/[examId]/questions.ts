import { z } from "zod"
import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js"
import { withAuth } from "../../_lib/middleware/withAuth.js"
import { withRole } from "../../_lib/middleware/withRole.js"
import { successResponse } from "../../_lib/utils/response.js"
import { parseOrThrow } from "../../_lib/utils/parse.js"
import { LangSchema, type ExamWithQuestions } from "../../../shared/schemas/exam.schema.js"
import { getExam, getExamQuestions } from "../../_lib/services/examService.js"
import { assertTrackAccess } from "../../_lib/services/trackService.js"

/** Exam ids are `exams.id`, a smallint identity — not a UUID like every other id in the API. */
const ExamIdSchema = z.coerce.number().int().positive({ error: "examId must be a positive integer" })

// Maps to GET /api/exams/<exam_id>/questions?lang=<ar|en>
// Supervisor-only AND enrollment-gated: the role decides who may read content at all, the
// enrollment decides which tracks' content. Always disclosed — this is the read-only question
// viewer and the source for preview sessions.
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, authUser, cookieHeaders) => {
      const url = new URL(request.url)
      // Path is /api/exams/<id>/questions — the id is the second-to-last segment.
      const examId = parseOrThrow(ExamIdSchema, url.pathname.split("/").at(-2) ?? "")
      const lang = parseOrThrow(LangSchema, url.searchParams.get("lang") ?? "")

      // The exam names its own track; a supervisor without an active enrollment sees nothing.
      // Read once and handed on — the response carries it anyway.
      const exam = await getExam(examId)
      await assertTrackAccess(authUser.id, exam.track_id)

      const result: ExamWithQuestions = await getExamQuestions(exam, lang)
      return successResponse(result, 200, cookieHeaders)
    }),
  ),
)
