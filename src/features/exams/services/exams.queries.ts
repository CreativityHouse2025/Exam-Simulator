import { queryOptions } from "@tanstack/react-query";
import { getTrackExams, getExamQuestions } from "@/core/services/exams.service";
import { isNotFoundError } from "@/core/errors";

// An unknown tag stays unknown; retrying only delays the not-found state.
const retryUnlessNotFound = (failureCount: number, error: Error) =>
  !isNotFoundError(error) && failureCount < 2;

export const createTrackExamsQueryOptions = (
  trackId: string,
  tagCode: string,
) =>
  queryOptions({
    queryKey: ["tracks", trackId, "exams", tagCode],
    queryFn: () => getTrackExams(trackId, tagCode),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: retryUnlessNotFound,
  });

/** Supervisor-only, fully disclosed content — the question viewer and preview sessions. */
export const createExamQuestionsQueryOptions = (examId: number) =>
  queryOptions({
    queryKey: ["exams", examId, "questions"],
    queryFn: () => getExamQuestions(examId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
  });
