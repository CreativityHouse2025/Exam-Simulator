import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../api/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  Attempt as SharedAttempt,
  AttemptList as SharedAttemptList,
  AttemptWithQuestions as SharedAttemptWithQuestions,
  Revision as SharedRevision,
  StartAttemptResponse as SharedStartAttemptResponse,
} from "@shared/attempt.schema";
import { markPersisted } from "../api/apiTypes";
import type {
  Attempt,
  AttemptWithQuestions,
  Revision,
  StartAttemptResult,
} from "../api/apiTypes";

type SaveAttemptAnswer = {
  questionId: number;
  selectedChoices: number[];
  isBookmarked: boolean;
};

export async function startAttempt(
  examId: number,
): Promise<StartAttemptResult> {
  const response = await apiFetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exam_id: examId }),
    handleUnauthorized: true,
  });
  const result: ApiResponse<SharedStartAttemptResponse> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  if (result.data.result === "in_progress") {
    return { result: "in_progress", attempt: toAttempt(result.data.attempt) };
  }

  return { result: "started", ...toAttemptWithQuestions(result.data) };
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

function toAttemptWithQuestions(
  data: SharedAttemptWithQuestions,
): AttemptWithQuestions {
  const { attempt, questions } = camelcaseKeys(data, { deep: true });
  return {
    // The backend pairs examState and result; the cast restores that pairing.
    attempt: {
      ...attempt,
      configSnapshot: markPersisted(attempt.configSnapshot),
    } as Attempt,
    questions,
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

  return result.data.attempts.map(toAttempt);
}

function toAttempt(data: SharedAttempt): Attempt {
  const attempt = camelcaseKeys(data, { deep: true });
  // The backend pairs examState and result; the cast restores that pairing.
  return {
    ...attempt,
    configSnapshot: markPersisted(attempt.configSnapshot),
  } as Attempt;
}
