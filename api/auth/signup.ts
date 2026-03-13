import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { supabaseClient } from "../_lib/supabaseClient.js"
import { successResponse } from "../_lib/utils/response.js"
import { AppError } from "../_lib/errors/AppError.js"
import { validateSignupBody } from "../_lib/validators/authValidator.js"
import verifySubscription from "../_lib/services/subscriptionVerifier.js"

export const POST = withErrorHandler(async (request: Request) => {
  const body: unknown = await request.json()
  const { email, password, first_name, last_name } = validateSignupBody(body)

  const { verified, highlevel_id } = await verifySubscription(email)
  if (!verified) {
    throw new AppError({ statusCode: 403, code: "SUBSCRIPTION_REQUIRED", message: "Active subscription not found" })
  }

  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + 6)

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

  return successResponse({ user_id: data.user.id, email: data.user.email }, 201)
})
