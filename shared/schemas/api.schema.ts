import { z } from "zod";

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
  "ATTEMPT_CREATE_FAILED",
  "ATTEMPT_SAVE_FAILED",
  // Grading failed. Distinct from ATTEMPT_SAVE_FAILED so a lost submission is distinguishable
  // from a lost autosave, in logs and in what the student is told.
  "ATTEMPT_SUBMIT_FAILED",
  "NOT_FOUND",
  "FORBIDDEN",
  "CONFLICT",
  // Produced by the platform's edge rate limiter, not by an API handler — the frontend raises it
  // from the raw 429 response so every failure reaching a caller carries an error code.
  "RATE_LIMITED",
]);

export type AppErrorCode = z.infer<typeof AppErrorCodeSchema>;

/**
 * The failure envelope carries the code and nothing else.
 *
 * No `message`: a server-side description names ids and often the driver's error, which would leak
 * schema and constraint names to anyone reading a network tab. It is logged instead — see
 * `errorResponse`. The frontend only ever used the code.
 */
export const ApiErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: AppErrorCodeSchema,
  }),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;

/**
 * Success envelope. Kept as a generic TypeScript type rather than a schema: zod cannot express a
 * generic schema without a factory, and no response is ever parsed at runtime.
 */
export type ApiSuccess<T> = { success: true; data: T };

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
