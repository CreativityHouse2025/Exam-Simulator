import camelcaseKeys from "camelcase-keys";
import { AppApiError } from "../errors";
import { apiFetch } from "../utils/apiFetch";
import type { ApiResponse } from "@shared/api.schema";
import type { User } from "@shared/user.schema";
import type { UserWithTracks } from "@shared/user.schema";
import type {
  User as FrontendUser,
  UserWithTracks as FrontendUserWithTracks,
} from "../apiTypes";

async function parseAuthResponse<T>(response: Response): Promise<T> {
  const result: ApiResponse<T> = await response.json();

  if (!result.success) {
    throw new AppApiError(result.error.code, "auth");
  }

  return result.data;
}

/**
 * @param handleUnauthorized - whether a 401 should sign the user out globally. False for the flows
 * that run while signed out (a 401 there is the answer, not an expired session).
 */
async function postAuth<T>(
  endpoint: string,
  body: object,
  handleUnauthorized = false,
): Promise<T> {
  const response = await apiFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    handleUnauthorized,
  });

  return parseAuthResponse<T>(response);
}

export async function signIn(
  email: string,
  password: string,
): Promise<FrontendUser> {
  const { user } = await postAuth<{ user: User }>("/api/auth/signin", {
    email,
    password,
  });
  return camelcaseKeys(user, { deep: true });
}

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
): Promise<void> {
  await postAuth<null>("/api/auth/signup", {
    email,
    password,
    first_name: firstName,
    last_name: lastName,
  });
}

export async function exchangeToken(
  accessToken: string,
  refreshToken: string,
): Promise<FrontendUser> {
  const { user } = await postAuth<{ user: User }>("/api/auth/token-exchange", {
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  return camelcaseKeys(user, { deep: true });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await postAuth<null>("/api/auth/password-reset", { email });
}

export async function updatePassword(password: string): Promise<void> {
  await postAuth<null>("/api/auth/update-password", { password }, true);
}

export async function signOut(): Promise<void> {
  await apiFetch("/api/auth/signout", {
    method: "POST",
    handleUnauthorized: false,
  });
}

/** Restores the signed-in user and their active-enrollment tracks from the session cookies. Throws when there is no valid session. */
export async function getMe(): Promise<FrontendUserWithTracks> {
  const response = await apiFetch("/api/auth/me", {
    handleUnauthorized: false,
  });
  const result = await parseAuthResponse<UserWithTracks>(response);
  return camelcaseKeys(result, { deep: true });
}
