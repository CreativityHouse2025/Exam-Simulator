
import { withAuth } from "../_lib/middleware/withAuth.js"
import { withErrorHandler } from "../_lib/middleware/withErrorHandler.js"
import { successResponse } from "../_lib/utils/response.js"
import { supabaseAdmin } from "../_lib/supabaseClient.js"
import { AppError } from "../_lib/errors/AppError.js"
import type { UserProfile } from "../_lib/types.js"

export const GET = withErrorHandler(
  withAuth(async (_request: Request, authUser, cookieHeaders) => {
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("id, first_name, last_name, expires_at")
      .eq("id", authUser.id)
      .single()

    if (error || !user) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "User not found" })
    }

    const profile: UserProfile = {
      id: user.id,
      email: authUser.email,
      first_name: user.first_name,
      last_name: user.last_name,
      expires_at: user.expires_at,
    }

    return successResponse({ user: profile }, 200, cookieHeaders)
  }),
)
