import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  ExamWithQuestions,
  LangCode,
  TrackExams,
} from "@shared/exam.schema";
import { markPersisted } from "../apiTypes";
import type {
  ExamWithQuestions as FrontendExamWithQuestions,
  TrackExams as FrontendTrackExams,
} from "../apiTypes";

export async function getTrackExams(
  trackId: string,
): Promise<FrontendTrackExams> {
  const response = await apiFetch(`/api/tracks/${trackId}/exams`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<TrackExams> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "exams");
  }

  const { exams, types } = camelcaseKeys(result.data, { deep: true });
  return {
    exams: exams.map((exam) => ({
      ...exam,
      config: markPersisted(exam.config),
    })),
    types,
  };
}

/** Supervisor-only: full, disclosed content of one exam. Powers the question viewer and preview sessions. */
export async function getExamQuestions(
  examId: number,
  lang: LangCode,
): Promise<FrontendExamWithQuestions> {
  const response = await apiFetch(
    `/api/exams/${examId}/questions?lang=${lang}`,
    {
      handleUnauthorized: true,
    },
  );
  const result: ApiResponse<ExamWithQuestions> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "exams");
  }

  const { exam, questions } = camelcaseKeys(result.data, { deep: true });
  return { exam: { ...exam, config: markPersisted(exam.config) }, questions };
}
