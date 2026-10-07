import { queryOptions } from "@tanstack/react-query";
import { getTrackExams, getExamQuestions } from "@/core/services/exams.service";

export const createTrackExamsQueryOptions = (trackId: string) =>
  queryOptions({
    queryKey: ["tracks", trackId, "exams"],
    queryFn: () => getTrackExams(trackId),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2,
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
