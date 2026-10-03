import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../_lib/middleware/withAuth.js";
import { withRole } from "../_lib/middleware/withRole.js";
import { successResponse } from "../_lib/utils/response.js";
import { AppError } from "../_lib/errors/AppError.js";
import { parseOrThrow } from "../_lib/utils/parse.js";
import { StudentIdSchema } from "../../shared/schemas/student.schema.js";
import type { UserWithTracks } from "../../shared/schemas/user.schema.js";
import { getUserWithTracks } from "../_lib/services/userService.js";

// Maps to GET /api/students/<student_id>
// What a supervisor opens a search hit into, and the only place a student's enrollments are
// assembled — which is why the search list itself carries no tracks.
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, _authUser, cookieHeaders) => {
      const studentId = parseOrThrow(StudentIdSchema, new URL(request.url).pathname.split("/").pop() ?? "");

      const result: UserWithTracks = await getUserWithTracks(studentId);

      // `getUserWithTracks` reads any user — it also serves /api/auth/me. 404 rather than 403:
      // a supervisor's id is simply not a student, and 403 would confirm the account exists.
      if (result.user.role !== "student") {
        throw new AppError({
          statusCode: 404,
          code: "NOT_FOUND",
          message: `User ${studentId} is not a student (role: ${result.user.role})`,
        });
      }

      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
