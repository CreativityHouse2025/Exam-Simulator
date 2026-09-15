import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type {
  AttemptSummary,
  GetAttemptResult,
  InsertAttemptRequestBody,
  SaveAttemptInProgress,
  SaveAttemptCompleted,
} from "@shared/attempt.schema";

export async function getAttempts(): Promise<AttemptSummary[]> {
  const response = await apiFetch("/api/attempts", {
    handleUnauthorized: true,
  });
  const result: ApiResponse<{ attempts: AttemptSummary[] }> =
    await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return result.data.attempts;
}

export async function getAttempt(id: string): Promise<GetAttemptResult> {
  const response = await apiFetch(`/api/attempts/${id}`, {
    handleUnauthorized: true,
  });
  const result: ApiResponse<GetAttemptResult> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return result.data;
}

export async function startAttempt(
  body: InsertAttemptRequestBody,
): Promise<{ attempt_id: string }> {
  const response = await apiFetch("/api/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    handleUnauthorized: true,
  });

  const result: ApiResponse<{ attempt_id: string }> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }

  return { attempt_id: result.data.attempt_id };
}

export async function saveAttempt(
  id: string,
  args: Omit<SaveAttemptInProgress, "exam_state">,
): Promise<void> {
  const response = await apiFetch(`/api/attempts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...args, exam_state: "in-progress" }),
    handleUnauthorized: true,
  });

  const result: ApiResponse<object> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }
}

export async function submitAttempt(
  id: string,
  args: Omit<SaveAttemptCompleted, "exam_state">,
): Promise<void> {
  const response = await apiFetch(`/api/attempts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...args, exam_state: "completed" }),
    handleUnauthorized: true,
  });

  const result: ApiResponse<object> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "attempts");
  }
}
