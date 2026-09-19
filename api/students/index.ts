import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../_lib/middleware/withAuth.js";
import { withRole } from "../_lib/middleware/withRole.js";
import { successResponse } from "../_lib/utils/response.js";
import { parseOrThrow } from "../_lib/utils/parse.js";
import { StudentSearchQuerySchema, type StudentList } from "../../shared/schemas/student.schema.js";
import { searchStudentsByEmailOrName } from "../_lib/services/studentService.js";

// Maps to GET /api/students?q=
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, _authUser, cookieHeaders) => {
      const rawQuery = new URL(request.url).searchParams.get("q") ?? "";
      const validatedQuery = parseOrThrow(StudentSearchQuerySchema, rawQuery);
      const result: StudentList = await searchStudentsByEmailOrName(validatedQuery);
      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
