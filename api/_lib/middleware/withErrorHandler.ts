import type { VercelRequest, VercelResponse } from "@vercel/node"
import type { ErrorResponseBody, VercelHandler } from "../types.js"
import { AppError } from "../errors/AppError.js"

/**
 * Middleware that handles thrown errors from vercel handlers
 * @param handler - The vercel handler that throws an error
 * @returns Wrapped handler with error mapping logic (Error instance -> HTTP response)
 */
export function withErrorHandler(handler: VercelHandler): VercelHandler {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      return await handler(req, res)
    } catch (error: unknown) {
      // if its an AppError, returns it as response
      if (error instanceof AppError) {
        console.error(`[AppError] ${error.code}: ${error.message}`)
        const body: ErrorResponseBody = {
          error: {
            code: error.code,
            message: error.message,
          },
        }
        return res.status(error.statusCode).json(body)
      }

      // otherwise return an internal error response
      console.error("[UnhandledError]", error)
      const body: ErrorResponseBody = {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }
      return res.status(500).json(body)
    }
  }
}
