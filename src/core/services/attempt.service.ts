import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  AttemptList as SharedAttemptList,
  AttemptWithExam as SharedAttemptWithExam,
  Revision as SharedRevision,
} from "@shared/attempt.schema";
import { markPersisted } from "../api/apiTypes";
import type { Attempt, AttemptWithExam, Revision } from "../api/apiTypes";

type SaveAttemptAnswer = {
  questionId: number;
  selectedChoices: number[];
  isBookmarked: boolean;
};

export async function startAttempt(
  examId: number,
): Promise<AttemptWithExam> {
  const response = await apiFetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam_id: examId }),
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedAttemptWithExam> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  const { attempt, questions, exam } = camelcaseKeys(result.data, {
    deep: true,
  });
  return {
    // The backend pairs examState and result; the cast restores that pairing.
    attempt: {
      ...attempt,
      configSnapshot: markPersisted(attempt.configSnapshot),
    } as Attempt,
    questions,
    exam,
  };
}

export async function getAttempt(
  attemptId: string,
): Promise<AttemptWithExam> {
  const response = await apiFetch(`/api/attempts/${attemptId}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedAttemptWithExam> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  const { attempt, questions, exam } = camelcaseKeys(result.data, {
    deep: true,
  });
  return {
    // The backend pairs examState and result; the cast restores that pairing.
    attempt: {
      ...attempt,
      configSnapshot: markPersisted(attempt.configSnapshot),
    } as Attempt,
    questions,
    exam,
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

export async function getRevision(
  attemptId: string,
): Promise<Revision> {
  const response = await apiFetch(`/api/attempts/${attemptId}/revision`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedRevision> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return camelcaseKeys(result.data, { deep: true });
}

export async function getAttempts(
  trackId: string,
): Promise<Attempt[]> {
  const response = await apiFetch(`/api/attempts?trackId=${trackId}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedAttemptList> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  // The backend pairs examState and result; the cast restores that pairing.
  return camelcaseKeys(result.data.attempts, { deep: true }).map(
    (attempt) =>
      ({
        ...attempt,
        configSnapshot: markPersisted(attempt.configSnapshot),
      }) as Attempt,
  );
}
