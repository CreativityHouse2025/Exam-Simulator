import type { ApiHandler } from "../types.js"
import { AppError } from "../errors/AppError.js"
import { errorResponse } from "../utils/response.js"

/**
 * Middleware that handles thrown errors from API handlers.
 * @param handler - The handler to wrap.
 * @returns Wrapped handler with error mapping logic (Error instance -> HTTP response).
 */
export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: Request) => {
    try {
      return await handler(req)
    } catch (error: unknown) {
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.code}: ${error.message}`)
        return errorResponse(error.code, error.message, error.statusCode)
      }

      console.error("[UnhandledError]", error)
      return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500)
    }
  }
}
