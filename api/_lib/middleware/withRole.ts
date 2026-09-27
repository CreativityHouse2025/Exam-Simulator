import type { AuthenticatedApiHandler } from "./withAuth.js"
import type { Role } from "../../../shared/schemas/user.schema.js"
import { AppError } from "../errors/AppError.js"
import { eq } from "drizzle-orm"
import { db, runQuery } from "../db/client.js"
import { users } from "../db/schema.js"

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
    // A failed query is a 500 (runQuery) and never falls through to the handler.
    const user = await runQuery(
      "Failed to verify role",
      db.query.users.findFirst({ columns: { role: true }, where: eq(users.id, authUser.id) }),
    )

    // A valid token with no profile row: the account is gone.
    if (!user) {
      throw new AppError({ statusCode: 401, code: "UNAUTHORIZED", message: "User not found" })
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError({ statusCode: 403, code: "FORBIDDEN", message: "Access denied" })
    }

    return handler(req, authUser, cookieHeaders)
  }
}
