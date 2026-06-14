import type { AppErrorCode } from "./types"

/** An API error that preserves the error code for callers that need to branch on it (e.g. SESSION_CONFLICT). */
export class AppApiError extends Error {
  constructor(
    message: string,
    public readonly code: AppErrorCode,
  ) {
    super(message)
    this.name = "AppApiError"
  }
}
