import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../../_lib/middleware/withAuth.js";
import { withRole } from "../../_lib/middleware/withRole.js";
import { successResponse } from "../../_lib/utils/response.js";
import { validateStudentId } from "../../_lib/validators/studentValidators.js";
import { getStudentAttempts } from "../../_lib/services/studentService.js";
import type { StudentAttemptsResult } from "../../_lib/types.js";

// Maps to GET /api/students/<student_id>/attempts
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, _authUser, cookieHeaders) => {
      // Path is /api/students/<id>/attempts — the id is the second-to-last segment, not the last.
      const studentId = new URL(request.url).pathname.split("/").at(-2) ?? "";
      const validatedId = validateStudentId(studentId);
      const result: StudentAttemptsResult =
        await getStudentAttempts(validatedId);
      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
