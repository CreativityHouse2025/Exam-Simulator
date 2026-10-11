import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "@/core/errors";
import { apiFetch } from "@/core/api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { ExamList, ExamWithQuestions } from "@shared/exam.schema";
import { toPersistedExam } from "@/core/api/apiTypes";
import type {
  Exam,
  ExamWithQuestions as FrontendExamWithQuestions,
} from "@/core/api/apiTypes";

/** One tag's exams on a track. An unknown tag code throws `NOT_FOUND`. */
export async function getTrackExams(
  trackId: string,
  tagCode: string,
): Promise<Exam[]> {
  const query = new URLSearchParams({ tag: tagCode });
  const response = await apiFetch(`/api/tracks/${trackId}/exams?${query}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<ExamList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "exams");
  }

  return camelcaseKeys(result.data.exams, { deep: true }).map(toPersistedExam);
}

/** Supervisor-only: full, disclosed content of one exam. Powers the question viewer and preview sessions. */
export async function getExamQuestions(
  examId: number,
): Promise<FrontendExamWithQuestions> {
  const response = await apiFetch(`/api/exams/${examId}/questions`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<ExamWithQuestions> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "exams");
  }

  const { exam, questions } = camelcaseKeys(result.data, { deep: true });
  return { exam: toPersistedExam(exam), questions };
}
