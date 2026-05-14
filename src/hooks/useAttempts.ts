import { useCallback } from "react"
import { AppApiError } from "./useAuth"
import { translate } from "../utils/translation"
import { apiFetch } from "../utils/apiFetch"
import type {
  ApiResponse,
  AppErrorCode,
  AttemptSummary,
  GetAttemptResult,
  InsertAttemptRequestBody,
  SaveAttemptInProgress,
  SaveAttemptCompleted,
} from "../types"

type AttemptErrorCode = Extract<
  AppErrorCode,
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "CONFLICT"
  | "ATTEMPT_CREATE_FAILED"
  | "ATTEMPT_SAVE_FAILED"
  | "UNAUTHORIZED"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "METHOD_NOT_ALLOWED"
  | "SUBSCRIPTION_CHECK_FAILED"
>

const errorCodeToTranslationKey: Record<AttemptErrorCode, string> = {
  NOT_FOUND: "attempts.errors.server-not-found",
  FORBIDDEN: "attempts.errors.server-forbidden",
  CONFLICT: "attempts.errors.server-conflict",
  ATTEMPT_CREATE_FAILED: "attempts.errors.server-create-failed",
  ATTEMPT_SAVE_FAILED: "attempts.errors.server-save-failed",
  UNAUTHORIZED: "attempts.errors.server-unknown",
  INTERNAL_ERROR: "attempts.errors.server-unknown",
  VALIDATION_ERROR: "attempts.errors.server-unknown",
  METHOD_NOT_ALLOWED: "attempts.errors.server-unknown",
  SUBSCRIPTION_CHECK_FAILED: "attempts.errors.server-unknown",
}

function translateErrorCode(code: AppErrorCode): string {
  const key = errorCodeToTranslationKey[code as AttemptErrorCode]
  return key ? translate(key) : translate("attempts.errors.server-unknown")
}

export default function useAttempts() {
  const getAttempts = useCallback(async (): Promise<AttemptSummary[]> => {
    const response = await apiFetch("/api/attempts")
    const result: ApiResponse<{ attempts: AttemptSummary[] }> = await response.json()

    if (!result.success) {
      throw new AppApiError(translateErrorCode(result.error.code), result.error.code)
    }

    return result.data.attempts
  }, [])

  const getAttempt = useCallback(async (id: string): Promise<GetAttemptResult> => {
    const response = await apiFetch(`/api/attempts/${id}`)
    const result: ApiResponse<GetAttemptResult> = await response.json()

    if (!result.success) {
      throw new AppApiError(translateErrorCode(result.error.code), result.error.code)
    }

    return result.data
  }, [])

  const startAttempt = useCallback(async (body: InsertAttemptRequestBody): Promise<{ attempt_id: string }> => {
    const response = await apiFetch("/api/attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    const result: ApiResponse<{ attempt_id: string }> = await response.json()

    if (!result.success) {
      throw new AppApiError(translateErrorCode(result.error.code), result.error.code)
    }

    return { attempt_id: result.data.attempt_id }
  }, [])

  const saveAttempt = useCallback(
    async (id: string, args: Omit<SaveAttemptInProgress, "exam_state">): Promise<void> => {
      const response = await apiFetch(`/api/attempts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...args, exam_state: "in-progress" }),
      })

      const result: ApiResponse<object> = await response.json()

      if (!result.success) {
        throw new AppApiError(translateErrorCode(result.error.code), result.error.code)
      }
    },
    [],
  )

  const submitAttempt = useCallback(
    async (id: string, args: Omit<SaveAttemptCompleted, "exam_state">): Promise<void> => {
      const response = await apiFetch(`/api/attempts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...args, exam_state: "completed" }),
      })

      const result: ApiResponse<object> = await response.json()

      if (!result.success) {
        throw new AppApiError(translateErrorCode(result.error.code), result.error.code)
      }
    },
    [],
  )

  return { getAttempts, getAttempt, startAttempt, saveAttempt, submitAttempt }
}
