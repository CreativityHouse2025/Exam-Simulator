import { queryOptions } from "@tanstack/react-query";
import { getTrackExams, getExamQuestions } from "@/core/services/exams.service";
import { isNotFoundError } from "@/core/errors";
import { forSignedInUser } from "@/core/utils/forSignedInUser";

// An unknown tag stays unknown; retrying only delays the not-found state.
const retryUnlessNotFound = (failureCount: number, error: Error) =>
  !isNotFoundError(error) && failureCount < 2;

export const createTrackExamsQueryOptions = (
  trackId: string,
  tagCode: string,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["tracks", trackId, "exams", tagCode, userId],
    queryFn: forSignedInUser(userId, () => getTrackExams(trackId, tagCode)),
    // Always stale: each exam's progress changes with every start and submit.
    staleTime: 0,
    gcTime: 30 * 60 * 1000,
    retry: retryUnlessNotFound,
  });

/** Supervisor-only, fully disclosed content — the question viewer and preview sessions. */
export const createExamQuestionsQueryOptions = (
  examId: number,
  userId: string | undefined,
) =>
  queryOptions({
    queryKey: ["exams", examId, "questions", userId],
    queryFn: forSignedInUser(userId, () => getExamQuestions(examId)),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
