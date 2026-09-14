import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../../_lib/middleware/withAuth.js";
import { withRole } from "../../_lib/middleware/withRole.js";
import { successResponse } from "../../_lib/utils/response.js";
import { parseOrThrow } from "../../_lib/utils/parse.js";
import { StudentIdSchema, type StudentAttemptsResult } from "../../../shared/schemas/student.schema.js";
import { getStudentAttempts } from "../../_lib/services/studentService.js";

// Maps to GET /api/students/<student_id>/attempts
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, _authUser, cookieHeaders) => {
      // Path is /api/students/<id>/attempts — the id is the second-to-last segment, not the last.
      const studentId = new URL(request.url).pathname.split("/").at(-2) ?? "";
      const validatedId = parseOrThrow(StudentIdSchema, studentId);
      const result: StudentAttemptsResult =
        await getStudentAttempts(validatedId);
      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
