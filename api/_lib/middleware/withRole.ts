import type { AuthenticatedApiHandler } from "./withAuth.js"
import type { Role } from "../../../shared/schemas/user.schema.js"
import { AppError } from "../errors/AppError.js"
import { supabaseAdmin } from "../supabaseClient.js"

/**
 * Middleware that guards a handler by role. Must run after `withAuth` (relies on `authUser`).
 *
 * Fail-closed: the wrapped handler only runs if the role check passes.
 *
 * A pure guard: the handler receives the same `AuthUser` `withAuth` resolved. The role is not
 * passed on — no handler branches on it, and one in the signature invites a second authorization
 * decision outside this file.
 *
 * Usage: `withErrorHandler(withAuth(withRole(["student"], handler)))`
 */
export function withRole(allowedRoles: Role[], handler: AuthenticatedApiHandler): AuthenticatedApiHandler {
  return async (req, authUser, cookieHeaders) => {
    const { data, error } = await supabaseAdmin.from("users").select("role").eq("id", authUser.id).single()

    if (!data || error) {
      // PGRST116 = zero or more than one row
      if (error.code === "PGRST116") {
        throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "User not found" })
      }
      // database error
      throw new AppError({ statusCode: 500, code: "INTERNAL_ERROR", message: "Failed to verify role" })
    }

    if (!allowedRoles.includes(data.role)) {
      throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Access denied" })
    }

    return handler(req, authUser, cookieHeaders)
  }
}
