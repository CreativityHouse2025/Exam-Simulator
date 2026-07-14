FEATURE: App Role-Based Access Control

OVERVIEW:
Add RBAC to the frontend and backend to control who can access what.
Two roles: `student` (default) and `supervisor`. Supervisors are blocked from taking or
listing attempts. Supervisor-specific functionality is a later spec.

ACCEPTANCE CRITERIA:

1. Users have a `role` that is either `supervisor` or `student`, `student` by default.
   Role is an enumerated value at the database level, not free text.
   Existing users become `student` without manual backfill, and the current signup flow
   keeps working unchanged.

2. A `withRole` middleware guards handlers by role.
   - It accepts a list of allowed roles.
   - It runs after authentication, so it always has an authenticated user.
   - A role change takes effect on the user's next request — a role must never be served
     from a stale cached credential.
   - Fail-closed: the guarded handler must not run unless the role check passes.

3. `role` is part of the frontend's auth context, exposed on the authenticated user.
   There is exactly one source of truth for it.

4. Every profile-hydrating flow returns the role: `/me`, sign in, and token exchange
   (signup confirmation and password reset).

5. Supervisors cannot take attempts or list their own attempts (backend only).
   - Creating an attempt and listing attempts are role-guarded to `student`.
   - Reading and saving a specific attempt are not role-guarded: they are already
     protected by attempt ownership, and a supervisor owns no attempts.

6. Students cannot access supervisor-specific handlers (upcoming spec — none exist yet).

GENERAL CONSTRAINTS:
- Frontend UI components remain untouched.
- Don't add any new types unless you are sure they don't exist in the type files.
- Use existing error codes, the existing error response function, and existing frontend
  messages. No invention.

OUT OF SCOPE:
- Any frontend component change.
- Any backend handler logic change. Handlers may only change where a role guard is applied
  to them, or where the role must be included in a hydrated profile (AC4).
- Supervisor-specific endpoints and UI.

EDGE CASES:
- A role mismatch returns 403 `FORBIDDEN`, and the frontend surfaces it as a toast.
- If the role cannot be read (user row missing, or database failure), the request is denied.
  It is never treated as allowed.
- Local auth-bypass mode is not exempt from the role check.

AUTH COOKIE INVARIANT (CRITICAL):
When authentication refreshes an expired access token, the refreshed tokens must reach the
client in every outcome — success, role denial, validation failure, handler error, or an
unexpected exception. A request that consumes a refresh token and then fails for any reason
must still return the new tokens in its response cookies, otherwise the client is left holding
credentials that have already been rotated away.

This invariant already exists and must not be weakened: every handler behind authentication
returns valid cookie headers in all cases. Any new middleware inserted into the auth chain
inherits this requirement — it must not short-circuit a response that drops refreshed cookies.

VERIFICATION:
1. Type-check passes.
2. Student: signs in, profile hydrates with role `student`, can start an exam and load
   attempt history.
3. Supervisor: profile hydrates with role `supervisor`; creating an attempt and listing
   attempts both return 403 `FORBIDDEN` and show a toast.
4. A request whose access token is refreshed mid-flight and then denied by the role guard
   still returns the refreshed auth cookies.

Do not implement until you are sure you know what you will do. If you don't know anything, ask, don't assume.
