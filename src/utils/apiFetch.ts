import { AppApiError } from "../errors";
import type { ApiError, AppErrorCode } from "@shared/api.schema";

let onUnauthorized: (() => Promise<void>) | null = null;

const VERCEL_RATE_LIMIT_RESPONSE_STATUS = 429;
const UNAUTHORIZED_RESPONSE_STATUS = 401;

export type ApiFetchOptions = RequestInit & {
  handleUnauthorized: boolean;
};

export function registerUnauthorizedHandler(
  signoutFunction: () => Promise<void>,
) {
  onUnauthorized = signoutFunction;
}

/**
 * Thin wrapper around fetch that intercepts Vercel 429 rate-limit responses and 401 unauthorized responses
 *
 * @param endpoint - The backend endpoint to be called
 * @param init - native `fetch` options plus an additional `handleUnauthorized` option that decides whether
 * to handle 401 errors internally or return the response to be handled in the caller (sign in, sign up)
 * @returns Response
 *
 * @throws { AppApiError } - If the endpoint is rate limited for the user, or the session is expired
 */
export async function apiFetch(
  endpoint: string,
  init: ApiFetchOptions,
): Promise<Response> {
  const { handleUnauthorized, ...fetchInit } = init;
  const response = await fetch(endpoint, fetchInit);

  if (response.status === VERCEL_RATE_LIMIT_RESPONSE_STATUS) {
    throw new AppApiError("RATE_LIMITED", "api");
  } else if (
    onUnauthorized &&
    handleUnauthorized &&
    response.status === UNAUTHORIZED_RESPONSE_STATUS
  ) {
    await onUnauthorized();
    let code: AppErrorCode = "UNAUTHORIZED";
    try {
      const result: ApiError = await response.json();
      code = result.error.code;
    } catch {
      // absorb .json errors
    }
    throw new AppApiError(code, "api");
  }

  return response;
}
