import { withErrorHandler } from "../../_lib/middleware/withErrorHandler.js";
import { withAuth } from "../../_lib/middleware/withAuth.js";
import { withRole } from "../../_lib/middleware/withRole.js";
import { successResponse } from "../../_lib/utils/response.js";
import { parseOrThrow } from "../../_lib/utils/parse.js";
import { StudentIdSchema } from "../../../shared/schemas/student.schema.js";
import type { AttemptList } from "../../../shared/schemas/attempt.schema.js";
import { TrackIdSchema } from "../../../shared/schemas/track.schema.js";
import { listAttempts } from "../../_lib/services/attemptService.js";
import { assertTrackAccess } from "../../_lib/services/trackService.js";

// Maps to GET /api/students/<student_id>/attempts?trackId=<uuid>
export const GET = withErrorHandler(
  withAuth(
    withRole(["supervisor"], async (request, authUser, cookieHeaders) => {
      const url = new URL(request.url);
      // Path is /api/students/<id>/attempts — the id is the second-to-last segment, not the last.
      const studentId = parseOrThrow(StudentIdSchema, url.pathname.split("/").at(-2) ?? "");
      const trackId = parseOrThrow(TrackIdSchema, url.searchParams.get("trackId") ?? "");

      // A supervisor sees nothing of a track they hold no active enrollment in — not its exams,
      // not its content, and not a student's attempts within it.
      await assertTrackAccess(authUser.id, trackId);

      const result: AttemptList = await listAttempts(studentId, trackId);
      return successResponse(result, 200, cookieHeaders);
    }),
  ),
);
