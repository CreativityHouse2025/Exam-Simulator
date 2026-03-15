import { supabaseClient } from "../supabaseClient.js"
import { AppError } from "../errors/AppError.js"
import type { SignupRequestBody } from "../types.js"
import verifySubscription from "./subscriptionVerifier.js"

export type SignupResult = {
  user_id: string
  email: string
}

export async function signup(input: SignupRequestBody): Promise<SignupResult> {
  const { email, password, first_name, last_name } = input

  const { verified, highlevel_id } = await verifySubscription(email)
  if (!verified) {
    throw new AppError({ statusCode: 403, code: "SUBSCRIPTION_REQUIRED", message: "Active subscription not found" })
  }

  const offerDurationInMonths = 6;

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + offerDurationInMonths)

  const { data, error } = await supabaseClient.auth.signUp({
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

  return { user_id: data.user.id, email: data.user.email! }
}
