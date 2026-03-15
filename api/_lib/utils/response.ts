import { ApiSuccess, ApiError, AppErrorCode } from "../types.js";

/**
 * Creates a successful JSON response with a consistent envelope.
 * @param data - The payload to return to the client.
 * @param status - HTTP status code. Defaults to 200.
 * @returns A `Response` object with `{ success: true, data }`.
 */
export function successResponse<T>(data: T, status = 200, headers?: [string, string][]): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return Response.json(body, { status, headers });
}

/**
 * Creates a failed JSON response with a consistent envelope.
 * @param code - A stable machine-readable error constant for the frontend to switch on (e.g. `'SUBSCRIPTION_EXPIRED'`).
 * @param message - A human-readable description of the error.
 * @param status - HTTP status code (e.g. 400, 401, 404, 500).
 * @returns A `Response` object with `{ success: false, error: { code, message } }`.
 */
export function errorResponse(code: AppErrorCode, message: string, status: number): Response {
  const body: ApiError = { success: false, error: { code, message } };
  return Response.json(body, { status });
}