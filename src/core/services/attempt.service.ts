import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  Attempt as SharedAttempt,
  AttemptList as SharedAttemptList,
  AttemptWithQuestions as SharedAttemptWithQuestions,
} from "@shared/attempt.schema";
import type { ExamWithQuestions as SharedExamWithQuestions } from "@shared/exam.schema";
import { markPersisted, toPersistedExam } from "../api/apiTypes";
import type {
  Attempt,
  AttemptList,
  AttemptPage,
  AttemptWithQuestions,
  ExamWithQuestions,
} from "../api/apiTypes";

type SaveAttemptAnswer = {
  questionId: number;
  selectedChoices: number[];
  isBookmarked: boolean;
};

/** An open attempt on this exam throws `ATTEMPT_IN_PROGRESS`; nothing is created. */
export async function startAttempt(
  examId: number,
): Promise<AttemptWithQuestions> {
  const response = await apiFetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam_id: examId }),
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedAttemptWithQuestions> =
    await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return toAttemptWithQuestions(result.data);
}

export async function getAttempt(
  attemptId: string,
): Promise<AttemptWithQuestions> {
  const response = await apiFetch(`/api/attempts/${attemptId}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedAttemptWithQuestions> =
    await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return toAttemptWithQuestions(result.data);
}

function toAttemptWithQuestions({
  attempt,
  questions,
}: SharedAttemptWithQuestions): AttemptWithQuestions {
  return {
    attempt: toAttempt(attempt),
    questions: camelcaseKeys(questions, { deep: true }),
  };
}

export async function saveAttempt(
  attemptId: string,
  args: {
    currentIndex: number;
    /** Null when the attempt is untimed. */
    timeRemaining: number | null;
    answers: SaveAttemptAnswer[];
    offeredBreaks: number[];
  },
): Promise<void> {
  const response = await apiFetch(`/api/attempts/${attemptId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_index: args.currentIndex,
      time_remaining: args.timeRemaining,
      answers: args.answers.map((answer) => ({
        question_id: answer.questionId,
        selected_choices: answer.selectedChoices,
        is_bookmarked: answer.isBookmarked,
      })),
      offered_breaks: args.offeredBreaks,
    }),
    handleUnauthorized: true,
  });

  const result: ApiResponse<null> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }
}

/**
 * Grades the attempt server-side and writes the result to the row — it does not return it. The
 * caller reads it back with `getAttempt`, same as a resume, which is also what discloses the
 * questions once the attempt is completed.
 */
export async function submitAttempt(
  attemptId: string,
  args: {
    currentIndex: number;
    /** Null when the attempt is untimed. */
    timeRemaining: number | null;
    answers: SaveAttemptAnswer[];
  },
): Promise<void> {
  const response = await apiFetch(`/api/attempts/${attemptId}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      current_index: args.currentIndex,
      time_remaining: args.timeRemaining,
      answers: args.answers.map((answer) => ({
        question_id: answer.questionId,
        selected_choices: answer.selectedChoices,
        is_bookmarked: answer.isBookmarked,
      })),
    }),
    handleUnauthorized: true,
  });

  const result: ApiResponse<null> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }
}

/** The parent exam and its wrong-or-unanswered questions. */
export async function getRevision(
  attemptId: string,
): Promise<ExamWithQuestions> {
  const response = await apiFetch(`/api/attempts/${attemptId}/revision`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedExamWithQuestions> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  const { exam, questions } = camelcaseKeys(result.data, { deep: true });
  return { exam: toPersistedExam(exam), questions };
}

/** The query string every attempt-history endpoint takes: the track and the page. */
export function attemptPageQuery(
  trackId: string,
  { page, perPage }: AttemptPage,
): URLSearchParams {
  return new URLSearchParams({
    trackId,
    page: String(page),
    per_page: String(perPage),
  });
}

export async function getAttempts(
  trackId: string,
  page: AttemptPage,
): Promise<AttemptList> {
  const response = await apiFetch(
    `/api/attempts?${attemptPageQuery(trackId, page)}`,
    { handleUnauthorized: true },
  );
  const result: ApiResponse<SharedAttemptList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return {
    attempts: result.data.attempts.map(toAttempt),
    total: result.data.total,
  };
}

function toAttempt(data: SharedAttempt): Attempt {
  const attempt = camelcaseKeys(data, { deep: true });
  // The backend pairs examState and result; the cast restores that pairing.
  return {
    ...attempt,
    exam: toPersistedExam(attempt.exam),
    configSnapshot: markPersisted(attempt.configSnapshot),
  } as Attempt;
}
