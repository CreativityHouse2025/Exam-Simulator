import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../_lib/middleware/withAuth.js";
import { withRole } from "../_lib/middleware/withRole.js";
import { successResponse } from "../_lib/utils/response.js";
import { validateStudentSearchQuery } from "../_lib/validators/studentValidators.js";
import { searchStudents } from "../_lib/services/studentService.js";
import type { SearchStudentsResult } from "../_lib/types.js";

// Maps to GET /api/students?q=
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, _authUser, cookieHeaders) => {
      const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
      const validatedQuery = validateStudentSearchQuery(rawQuery);
      const result: SearchStudentsResult = await searchStudents(validatedQuery);
      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
