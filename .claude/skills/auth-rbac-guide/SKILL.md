---
name: auth-rbac-guide
description: "Authentication, roles, and access control for the Exam Simulator — the student/supervisor/guest role model, RouteGuard and nav gating on the frontend, withAuth/withRole enforcement on the backend, enrollment-based track access, and the single-session-per-account limit now enforced by Supabase Auth itself rather than by this codebase. Use this skill before touching sign-in, sign-up, sign-out, password reset, token exchange, session cookies, users.role, enrollments, RouteGuard, src/config/roles.ts or nav.ts, or any check of who is allowed to see or do something. Also use when debugging an unexpected 403, a user logged out for no reason, or a suspected account-sharing bypass. These rules fail open when improvised — read them before writing the check."
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
  falls back to `refreshSession` with the refresh token, and forwards refreshed `Set-Cookie`
  headers to the handler. **There is no bypass** — the `BYPASS_AUTH` /
  `BYPASS_AUTH_USER_ID` escape hatch was removed. Sign in with a seeded account instead. Do not
  reintroduce one: a switch that disables authentication is one stray environment variable away
  from handing over every account.
- `withRole` — reads `users.role` with the admin client and **fails closed** with 403 unless the
  role is allowed. It is a **pure guard**: it does not hand the role down, because no handler
  branches on it and a role in the signature invites one to start.

Handlers must pass `cookieHeaders` into `successResponse`, or a refreshed session is dropped and
the user is logged out on their next request. See `backend-guide` for the full middleware chain.

Adding a new endpoint without `withRole` is the single easiest way to open a hole here. If an
endpoint is genuinely public, say so in a comment so the omission reads as intentional.

## Account expiry — removed

There is none, as of migration 019. `users.expires_at`, `assertAccountNotExpired` and the global
sign-out it triggered are all gone. **An account signs in indefinitely.** What a user may actually
do is decided by enrollments alone, below.

`ACCOUNT_EXPIRED` still exists in the `AppErrorCode` enum and in the frontend's translation map,
but nothing can emit it. Do not reach for it.

## Enrollment expiry — a different clock, and both bounds

`enrollments.expires_at` is now the only expiry in the system — the account one was dropped in
019. Note `EnrolledTrack.expires_at` in a response is the ENROLLMENT's, never the user's.

An enrollment is ACTIVE when its window **contains now** — `created_at <= now() AND
expires_at > now()`. Filter on both bounds, always:

```ts
.lte("created_at", "now")   // "now" is evaluated by Postgres, not Node
.gt("expires_at", "now")
```

`enrollments_no_overlap` (011) excludes *overlapping* ranges, not adjacent ones, so a renewal
dated to begin exactly when the current one ends is a supported state. Filtering on `expires_at`
alone then matches the future row as readily as the running one, which caused two bugs at once:
a pre-provisioned enrollment granted access before its start date, and two rows matched a
`maybeSingle()`, returning PGRST116 — a 500 that locked the student out of the track entirely.
With both bounds the exclusion constraint guarantees at most one match, which is what makes
`maybeSingle()` correct rather than lucky.

Two readers apply this rule and **must stay in step** — change one, change both, or a track is
advertised by `/api/auth/me` and then refused by every endpoint scoped to it:

- `trackService.assertTrackAccess` — the guard on every track-scoped resource
- `userService.getUserWithTracks` — the same filter applied to the embedded resource
  (`.lte("enrollments.created_at", "now")`)

Track access applies to **both roles**. A supervisor enrols exactly as a student does and sees
nothing of a track they hold no active enrollment in — not its exam list, not its question
content, not a student's attempts within it.

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
- **`users.role`, `enrollments`, the session-counting RPC → invoke `database-guide`.**
- **RouteGuard placement, nav config, provider tree → invoke `frontend-guide`.**
- **Supervisor preview sessions** (running an exam without writing to the DB) are documented in
  `frontend-guide`.
