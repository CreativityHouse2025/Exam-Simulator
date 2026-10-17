import { queryOptions } from "@tanstack/react-query";
import {
  searchStudents,
  getStudent,
  getStudentAttempts,
} from "./student.service";
import { forSignedInUser } from "@/core/utils/forSignedInUser";
import type { AttemptPage } from "@/core/api/apiTypes";

/** query must already be trimmed and >= the minimum search length. */
export const createStudentSearchQueryOptions = (
  query: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["students", "search", query, userId],
    queryFn: forSignedInUser(userId, ({ signal }: { signal: AbortSignal }) =>
      searchStudents(query, signal),
    ),
    enabled: query.length >= 2,
    staleTime: 3 * 60 * 1000, // refresh each 3 minutes
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
export const createStudentAttemptsQueryOptions = (
  id: string,
  trackId: string,
  page: AttemptPage,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: [
      "students",
      id,
      "attempts",
      trackId,
      page.page,
      page.perPage,
      userId,
    ],
    queryFn: forSignedInUser(userId, ({ signal }: { signal: AbortSignal }) =>
      getStudentAttempts(id, trackId, page, signal),
    ),
    // Always stale: the student may be practising while the supervisor watches.
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
/** A student's profile and the tracks they hold an active enrollment in — what a supervisor opens a search hit into. */
export const createStudentQueryOptions = (
  id: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["students", id, userId],
    queryFn: forSignedInUser(userId, () => getStudent(id)),
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
  });
