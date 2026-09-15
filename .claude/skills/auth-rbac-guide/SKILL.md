---
name: auth-rbac-guide
description: "Authentication, roles, and access control for the Exam Simulator — the student/supervisor/guest role model, RouteGuard and nav gating on the frontend, withAuth/withRole enforcement on the backend, account expiry, and the single-session-per-account limit now enforced by Supabase Auth itself rather than by this codebase. Use this skill before touching sign-in, sign-up, sign-out, password reset, token exchange, session cookies, users.role or users.expires_at, RouteGuard, src/config/roles.ts or nav.ts, or any check of who is allowed to see or do something. Also use when debugging an unexpected 403, a user logged out for no reason, or a suspected account-sharing bypass. These rules fail open when improvised — read them before writing the check."
---

# Auth & RBAC Guide

## Overview

Two roles use the app: **students** (take exams, review their attempt history) and **supervisors**
(browse the exam library, inspect questions, run ephemeral preview sessions, search students and
read their attempts). Access control is enforced twice — once in the UI for navigation, once in the
API for security — and the two are deliberately independent.

The written specs behind these features are in `docs/specs/` (`spec-rbac.md`, `spec-supervision.md`,
`spec-supervisor-exam-student-view.md`). Read the relevant spec before changing behaviour.

## Role model

`Role = "student" | "supervisor" | "guest"` (`src/config/roles.ts`). `guest` means `user === null`
and is **never stored** — it is an absence, not a row value. Don't add it to the database or write
a migration for it.

## Frontend gating (UX only)

- `RouteGuard` (`src/guards/RouteGuard.tsx`) wraps route branches in `src/App.tsx` and redirects to
  sign-in (guest) or home (wrong role).
- Nav items per role live in `src/config/nav.ts`.
- Every URL comes from `src/config/routes.ts` — dynamic routes expose `pattern` for `<Route>` and
  `to()` for links.

Treat all of this as presentation. A route guard stops a student seeing a supervisor link; it does
not stop them calling the endpoint.

## Backend gating (the real boundary)

Every non-public endpoint is wrapped:

```ts
export const GET = withErrorHandler(withAuth(withRole(["supervisor"], handler)))
```

- `withAuth` — validates the access token from cookies via `getClaims` (local JWKS verification),
  falls back to `refreshSession` with the refresh token, re-checks account expiry, and forwards
  refreshed `Set-Cookie` headers to the handler. Dev-only bypass: `BYPASS_AUTH=true` +
  `BYPASS_AUTH_USER_ID` — **never set in production**.
- `withRole` — reads `users.role` with the admin client and **fails closed** with 403 unless the
  role is allowed.

Handlers must pass `cookieHeaders` into `successResponse`, or a refreshed session is dropped and
the user is logged out on their next request. See `backend-guide` for the full middleware chain.

Adding a new endpoint without `withRole` is the single easiest way to open a hole here. If an
endpoint is genuinely public, say so in a comment so the omission reads as intentional.

## Account expiry

Enforced by `assertAccountNotExpired`, called on sign-in **and on every token refresh** in
`withAuth`. An expired account is signed out globally. Expiry is a column on `public.users`
(`expires_at`), so it survives independently of the auth session — see `database-guide`.

## Single session enforcement

Each account is limited to one active session at a time. This prevents account sharing across
devices, which is the commercial reason the feature exists — a weakened check has revenue
consequences, not just security ones.

**Enforcement lives in Supabase Auth, not in this repo.** It is the *Single session per user*
option under the project's Auth → Sessions settings (Pro plan and up). There is no code path you
can read to confirm it is on, and no test that fails when it is off — if account sharing is
reported, check that toggle before reading any of this code. Every Supabase project used by the
app (production and any staging project) needs it set independently.

Two consequences follow from how Supabase implements it:

- **Newest sign-in wins, silently.** Signing in on a second device terminates the first device's
  session. There is no conflict prompt and no `SESSION_CONFLICT` error — the `force` flag and that
  error code were removed when enforcement moved to Supabase. Don't reintroduce a "force" concept;
  every sign-in is effectively a force sign-in now.
- **Revocation is not immediate.** Supabase checks the limit when a session is *refreshed*, and
  `withAuth` verifies access tokens locally via `getClaims` with no `auth.sessions` lookup. So a
  terminated session keeps working until its access token expires — bounded by the project's JWT
  expiry setting, not by the sign-in that killed it. Shortening JWT expiry shortens that overlap
  window and nothing in the code does.

### Session entry points

Every path below creates a row in `auth.sessions`. Supabase's own enforcement covers all of them,
including the two where the session is created by GoTrue before any of our code runs:

| Entry point | Where the session is created |
| --- | --- |
| Sign In (`POST /api/auth/signin`) | `signInWithPassword` in `authService.signin` |
| Sign Up (`POST /api/auth/signup`) | `auth.signUp` — only returns a session if email confirmation is disabled |
| Password reset (`type=recovery`) | GoTrue `/auth/v1/verify` when the emailed link is clicked, before `token-exchange` is called |
| Email confirmation (`type=signup`) | the same GoTrue verify step |

`confirmMagicLinkSignin` still calls `admin.signOut(accessToken, "others")` unconditionally. That
is **not** redundant with the Supabase setting: it is kept for password reset, where the point is
to revoke a compromised device *now* rather than whenever its access token happens to expire. It
stays unconditional so the `type` field cannot be spoofed to skip it.

The `user.id` null assertion in `signin` predates this change and still guards against a malformed
sign-in response reaching the profile query. Keep it.

## Related skills

- **Middleware composition, handler/service layering, error codes → invoke `backend-guide`.**
- **`users.role`, `users.expires_at`, the session-counting RPC → invoke `database-guide`.**
- **RouteGuard placement, nav config, provider tree → invoke `frontend-guide`.**
- **Supervisor preview sessions** (running an exam without writing to the DB) are documented in
  `frontend-guide`.
