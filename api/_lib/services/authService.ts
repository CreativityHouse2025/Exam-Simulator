import { supabaseAdmin, createUserClient } from "../supabaseClient.js"
import { AppError } from "../errors/AppError.js"
import type { SignupRequestBody, SigninRequestBody, SigninResult } from "../types.js"
import verifySubscription from "./subscriptionVerifier.js"

/**
 * Checks that a user's account has not expired.
 * Queries the `users` table unless `knownExpiresAt` is provided (avoids a redundant DB hit
 * when the caller already has the value, e.g. after fetching the profile in `signin`).
 *
 * If the account is expired and `revokeAccessToken` is provided, a global signout is
 * awaited before throwing to ensure the session is revoked.
 *
 * @throws {AppError} 401 `UNAUTHORIZED` — user not found in the database.
 * @throws {AppError} 403 `ACCOUNT_EXPIRED` — account past its expiry date.
 */
export async function assertAccountNotExpired(
  userId: string,
  options?: { revokeAccessToken?: string; knownExpiresAt?: string },
): Promise<void> {
  let expiresAtRaw = options?.knownExpiresAt

  if (!expiresAtRaw) {
    const { data, error } = await supabaseAdmin.from("users").select("expires_at").eq("id", userId).single()

    if (error || !data) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "User not found" })
    }

    expiresAtRaw = data.expires_at
  }  

  const expiresAt = new Date(expiresAtRaw)
  if (expiresAt <= new Date()) {
    if (options?.revokeAccessToken) {
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(options.revokeAccessToken, "global")
      if (signOutError) {
        console.error(`[assertAccountNotExpired] Failed to sign out expired user ${userId}:`, signOutError)
      } else {
        console.log("[assertAccountNotExpired] Logged user out of all devices")
      }
    }
    console.log(`[assertAccountNotExpired] User ${userId} account has expired`)
    throw new AppError({ statusCode: 403, code: "ACCOUNT_EXPIRED", message: "Account has expired" })
  }
}

/**
 * Best-effort server-side session revocation with two fallback strategies.
 * **Never throws** — the handler always clears cookies regardless of outcome.
 *
 * Strategy 1: Revoke via access token (fast path).
 * Strategy 2: If access token is missing/expired, use refresh token to obtain a fresh
 *             session, then revoke it. Refreshing also rotates (invalidates) the old refresh token.
 * Both fail:  Log a warning and return silently.
 */
export async function signout(params: { accessToken?: string; refreshToken?: string }): Promise<void> {
  const { accessToken, refreshToken } = params

  // Strategy 1: try revoking with the access token directly
  if (accessToken) {
    const { error } = await supabaseAdmin.auth.admin.signOut(accessToken, "local")
    if (!error) return
    console.warn("[signout] Strategy 1 failed (access token):", error.message)
  }

  // Strategy 2: refresh to get a valid token, then revoke
  if (refreshToken) {
    const userClient = createUserClient()
    const { data, error: refreshError } = await userClient.auth.refreshSession({ refresh_token: refreshToken })

    if (refreshError || !data.session) {
      console.warn("[signout] Strategy 2 failed (refresh):", refreshError?.message ?? "no session returned")
      return
    }

    const { error: revokeError } = await supabaseAdmin.auth.admin.signOut(data.session.access_token, "local")
    if (revokeError) {
      console.warn("[signout] Strategy 2 failed (revoke after refresh):", revokeError.message)
    }
    return
  }

  // No tokens provided at all
  console.warn("[signout] No tokens provided — cookies will be cleared but no server session revoked")
}

export type SignupResult = {
  user_id: string
  email: string
}

/**
 * Registers a new user after verifying an active HighLevel subscription.
 * Creates a Supabase auth user with a 6-month expiry stored in user metadata.
 *
 * @throws {AppError} 403 `SUBSCRIPTION_REQUIRED` — no active HighLevel subscription found.
 * @throws {AppError} 500 `SIGNUP_FAILED` — Supabase auth creation failed.
 */
export async function signup(input: SignupRequestBody): Promise<SignupResult> {
  const { email, password, first_name, last_name } = input

  const { verified, highlevel_id } = await verifySubscription(email)
  if (!verified) {
    throw new AppError({ statusCode: 403, code: "SUBSCRIPTION_REQUIRED", message: "Active subscription not found" })
  }

  const offerDurationInMonths = 6;

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + offerDurationInMonths)

  const userClient = createUserClient()
  const { data, error } = await userClient.auth.signUp({
    email,
    password,
    options: {
      data: { first_name, last_name, highlevel_id, expires_at: expiresAt.toISOString() },
    },
  })
  
  if (error) {
    throw new AppError({ statusCode: 500, code: "SIGNUP_FAILED", message: error.message })
  }

  if (!data.user) {
    throw new AppError({ statusCode: 500, code: "SIGNUP_FAILED", message: "Signup failed: no user returned" })
  }

  console.log(`[signup] User with email ${email} signed up successfully `)

  return { user_id: data.user.id, email: data.user.email! }
}

/**
 * Authenticates a user with email/password, fetches their profile, and checks account expiry.
 * If the account is expired, the session is revoked (fire-and-forget) before throwing.
 *
 * @returns User profile and session tokens (handler is responsible for setting cookies).
 * @throws {AppError} 401 `INVALID_CREDENTIALS` — wrong email or password.
 * @throws {AppError} 500 `SIGNIN_FAILED` — no session returned or profile not found.
 * @throws {AppError} 403 `ACCOUNT_EXPIRED` — account past its expiry date.
 */
export async function signin(input: SigninRequestBody): Promise<SigninResult> {
  const { email, password } = input

  const userClient = createUserClient()
  const { data, error } = await userClient.auth.signInWithPassword({ email, password })

  if (error) {
    throw new AppError({ statusCode: 401, code: "INVALID_CREDENTIALS", message: "Invalid email or password" })
  }

  if (!data.session) {
    throw new AppError({ statusCode: 500, code: "SIGNIN_FAILED", message: "Signin failed: no session returned" })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, expires_at")
    .eq("id", data.user.id)
    .single()

  if (profileError || !profile) {
    throw new AppError({ statusCode: 500, code: "SIGNIN_FAILED", message: "Failed to retrieve user profile" })
  }

  await assertAccountNotExpired(data.user.id, {
    revokeAccessToken: data.session.access_token,
    knownExpiresAt: profile.expires_at,
  })

  console.log(`[signin] User ${data.user.id} signed in successfully`)

  return {
    user: {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      expires_at: profile.expires_at,
    },
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  }
}

/**
 * Validates confirmation tokens from a signup email link and returns the user profile with tokens.
 * Uses `supabaseAdmin.auth.getUser()` to verify the access token without needing a session.
 *
 * @returns User profile and session tokens (handler is responsible for setting cookies).
 * @throws {AppError} 401 `CONFIRMATION_FAILED` — invalid or expired confirmation link.
 * @throws {AppError} 500 `CONFIRMATION_FAILED` — user profile not found in the database.
 */
export async function confirmSignup(accessToken: string, refreshToken: string): Promise<SigninResult> {
  const { data: authUser, error } = await supabaseAdmin.auth.getUser(accessToken)

  if (error || !authUser.user) {
    throw new AppError({ statusCode: 401, code: "CONFIRMATION_FAILED", message: "Invalid or expired confirmation link" })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("id, first_name, last_name, email, expires_at")
    .eq("id", authUser.user.id)
    .single()

  if (profileError || !profile) {
    throw new AppError({ statusCode: 500, code: "CONFIRMATION_FAILED", message: "User profile not found" })
  }

  console.log(`[confirmSignup] User ${authUser.user.id} confirmed successfully`)

  return {
    user: {
      id: profile.id,
      email: profile.email,
      first_name: profile.first_name,
      last_name: profile.last_name,
      expires_at: profile.expires_at,
    },
    access_token: accessToken,
    refresh_token: refreshToken,
  }
}
