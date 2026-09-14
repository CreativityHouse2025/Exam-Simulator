---
name: auth-rbac-guide
description: "Authentication, roles, and access control for the Exam Simulator — the student/supervisor/guest role model, RouteGuard and nav gating on the frontend, withAuth/withRole enforcement on the backend, account expiry, and the single-session-per-account enforcement with its force-flag sign-in flow and every auth.sessions entry point it must cover. Use this skill before touching sign-in, sign-up, sign-out, password reset, token exchange, session cookies, users.role or users.expires_at, RouteGuard, src/config/roles.ts or nav.ts, or any check of who is allowed to see or do something. Also use when debugging an unexpected 403, a user logged out for no reason, or a suspected account-sharing bypass. These rules fail open when improvised — read them before writing the check."
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

### Sign-in flow (force flag pattern)

The sign-in handler accepts a `force` boolean alongside email and password. Three cases:

1. **`force: false`, no conflict** — `signInWithPassword` → assert `user.id` non-null → RPC returns 1
   → fetch profile → check expiry → return profile + cookies
2. **`force: false`, conflict** — `signInWithPassword` → assert `user.id` non-null → RPC returns ≥ 2
   → `admin.signOut(newJWT, 'local')` → throw `SESSION_CONFLICT`
3. **`force: true`** — `signInWithPassword` → assert `user.id` non-null →
   `admin.signOut(newJWT, 'others')` (no RPC needed) → fetch profile → check expiry → return
   profile + cookies

The `user.id` null assertion guards against the RPC silently returning 0 on `WHERE user_id = NULL`,
which would bypass enforcement entirely. Keep it.

On RPC failure: **fail closed** — signOut local, throw internal error. Never silently proceed as
"no conflict."

### Session entry points

Every path that creates a row in `auth.sessions` must be covered. Adding a new sign-in path without
covering it here reopens the hole:

| Entry point | Coverage |
| --- | --- |
| Sign In | force flag + `count_user_sessions` RPC |
| Password reset (token-exchange, `type=recovery`) | unconditional `signOut("others")` in `confirmMagicLinkSignin` |
| Email confirmation (token-exchange, `type=signup`) | the same unconditional `signOut("others")` — a no-op when no other sessions exist, but kept unconditional so the `type` field cannot be spoofed to bypass it |

## Related skills

- **Middleware composition, handler/service layering, error codes → invoke `backend-guide`.**
- **`users.role`, `users.expires_at`, the session-counting RPC → invoke `database-guide`.**
- **RouteGuard placement, nav config, provider tree → invoke `frontend-guide`.**
- **Supervisor preview sessions** (running an exam without writing to the DB) are documented in
  `frontend-guide`.
