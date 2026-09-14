import { z } from "zod"

/**
 * Every error code the API can return. The frontend branches on these codes and maps them to
 * translated copy — the accompanying `message` is developer-facing only and is never displayed.
 */
export const AppErrorCodeSchema = z.enum([
  "METHOD_NOT_ALLOWED",
  "INTERNAL_ERROR",
  "VALIDATION_ERROR",
  "SUBSCRIPTION_REQUIRED",
  "SIGNUP_FAILED",
  "INVALID_CREDENTIALS",
  "ACCOUNT_EXPIRED",
  "SIGNIN_FAILED",
  "SIGNOUT_FAILED",
  "UNAUTHORIZED",
  "CONFIRMATION_FAILED",
  "SUBSCRIPTION_CHECK_FAILED",
  "PASSWORD_UPDATE_FAILED",
  "SESSION_CONFLICT",
  "ATTEMPT_CREATE_FAILED",
  "ATTEMPT_SAVE_FAILED",
  "NOT_FOUND",
  "FORBIDDEN",
  "CONFLICT",
])

export type AppErrorCode = z.infer<typeof AppErrorCodeSchema>

export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: AppErrorCodeSchema,
    message: z.string(),
  }),
})

export type ApiError = z.infer<typeof ApiErrorSchema>

/**
 * Success envelope. Kept as a generic TypeScript type rather than a schema: zod cannot express a
 * generic schema without a factory, and no response is ever parsed at runtime.
 */
export type ApiSuccess<T> = { success: true; data: T }

export type ApiResponse<T> = ApiSuccess<T> | ApiError
