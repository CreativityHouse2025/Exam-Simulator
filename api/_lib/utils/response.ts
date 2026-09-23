import type { ApiSuccess, ApiError, AppErrorCode } from "../../../shared/schemas/api.schema.js";

/** Extra headers to attach to a response, most often refreshed auth cookies. */
export type ResponseHeaders = [string, string][];

/**
 * Creates a successful JSON response with a consistent envelope.
 * @param data - The payload to return to the client.
 * @param status - HTTP status code. Defaults to 200.
 * @returns A `Response` object with `{ success: true, data }`.
 */
export function successResponse<T>(data: T, status = 200, headers?: ResponseHeaders): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { status, headers });
}

/**
 * Creates a failed JSON response, and logs why.
 *
 * Every error path ends here — `withErrorHandler` and `withAuth` alike — so the logging lives here
 * and no later path can forget it or leak a cause by serializing one.
 *
 * @param code - Machine-readable constant the frontend switches on. The only thing sent.
 * @param logMessage - Why it failed. NEVER reaches the client, so it may carry driver text and ids.
 * @param status - HTTP status code (e.g. 400, 401, 404, 500).
 * @returns A `Response` with `{ success: false, error: { code } }`.
 */
export function errorResponse(code: AppErrorCode, logMessage: string, status: number, headers?: ResponseHeaders): Response {
  console.error(`[${status} ${code}] ${logMessage}`);
  const body: ApiError = { success: false, error: { code } };
  return Response.json(body, { status, headers });
}