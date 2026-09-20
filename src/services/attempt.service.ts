import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { LangCode } from "@shared/exam.schema";
import type {
  AttemptList,
  AttemptWithExam,
  Revision,
} from "@shared/attempt.schema";
import { markPersisted } from "../apiTypes";
import type {
  AttemptSummary as FrontendAttemptSummary,
  AttemptWithExam as FrontendAttemptWithExam,
  Revision as FrontendRevision,
} from "../apiTypes";

type SaveAttemptAnswer = {
  questionId: number;
  selectedChoices: number[];
  isBookmarked: boolean;
};

export async function startAttempt(
  examId: number,
  lang: LangCode,
): Promise<FrontendAttemptWithExam> {
  const response = await apiFetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam_id: examId, lang }),
    handleUnauthorized: true,
  });
  const result: ApiResponse<AttemptWithExam> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  const { attempt, questions, exam } = camelcaseKeys(result.data, { deep: true });
  return { attempt: { ...attempt, configSnapshot: markPersisted(attempt.configSnapshot) }, questions, exam };
}

export async function getAttempt(
  attemptId: string,
  lang: LangCode,
): Promise<FrontendAttemptWithExam> {
  const response = await apiFetch(`/api/attempts/${attemptId}?lang=${lang}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<AttemptWithExam> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  const { attempt, questions, exam } = camelcaseKeys(result.data, { deep: true });
  return { attempt: { ...attempt, configSnapshot: markPersisted(attempt.configSnapshot) }, questions, exam };
}

export async function saveAttempt(
  attemptId: string,
  args: {
    currentIndex: number;
    timeRemaining: number;
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
    timeRemaining: number;
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

export async function getRevision(
  attemptId: string,
  lang: LangCode,
): Promise<FrontendRevision> {
  const response = await apiFetch(
    `/api/attempts/${attemptId}/revision?lang=${lang}`,
    { handleUnauthorized: true },
  );
  const result: ApiResponse<Revision> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return camelcaseKeys(result.data, { deep: true });
}

export async function getAttempts(
  trackId: string,
): Promise<FrontendAttemptSummary[]> {
  const response = await apiFetch(`/api/attempts?trackId=${trackId}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<AttemptList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return camelcaseKeys(result.data.attempts, { deep: true }).map((attempt) => ({
    ...attempt,
    configSnapshot: markPersisted(attempt.configSnapshot),
  }));
}
