---
name: backend-guide
description: "Vercel serverless API architecture for the Exam Simulator — the handler/service/validator three-layer split, the withErrorHandler → withAuth → withRole middleware chain, AppError and the error-code contract the frontend parses, response builders and cookie forwarding, and the NodeNext .js-extension import rule. Use this skill whenever creating, editing, debugging, or reviewing anything under api/, adding an endpoint, moving logic between a handler and a service, writing request validation, changing an error response, or when an API call returns an unexpected 401/403/500. Routes on to auth-rbac-guide for session and role enforcement details, and database-guide for Supabase queries and RPCs."
---

# Backend Guide (Vercel serverless API)

## Overview

`api/` contains Vercel serverless functions written as **Web Fetch handlers**: each file exports
named `GET`/`POST`/etc. handlers with the signature `(request: Request) => Promise<Response>`.
There is no Express, no framework routing — the file path *is* the route.

The whole layout exists to make business logic testable without constructing an HTTP request.
If you find yourself reaching for `Request` or a status code outside a handler file, something is
in the wrong layer.

## The three layers

- **Handler** (`api/*.ts`) — parses and validates the request, calls the service, returns the HTTP
  response. No business logic.
- **Service** (`api/_lib/services/`) — all business logic. Knows nothing about HTTP: no `Request`,
  no `Response`, no status codes. Throws `AppError` when something is wrong.
- **Validation** (`api/_lib/validators/`) — pure functions that validate and parse request input,
  called by the handler before the service. Throw `AppError` on failure.

The test: if logic can be unit tested without mocking an HTTP request, it belongs in the service.
Keep handlers thin enough to read in one screen.

## Middleware chain (order matters)

```ts
export const GET = withErrorHandler(withAuth(withRole(["supervisor"], handler)))
```

- `withErrorHandler` — **outermost, always**. Maps a thrown `AppError` (and `SyntaxError` from JSON
  parsing) to an HTTP error response. Without it on the outside, a throw from any inner layer
  escapes as an opaque 500.
- `withAuth` — validates the access token from cookies via `getClaims` (local JWKS verification),
  falls back to `refreshSession` with the refresh token, re-checks account expiry, and forwards
  refreshed `Set-Cookie` headers to the handler. Dev-only bypass: `BYPASS_AUTH=true` +
  `BYPASS_AUTH_USER_ID`. Never set in production.
- `withRole` — reads `users.role` with the admin client and **fails closed** with 403 unless the
  role is allowed.

Handlers receive `(request, authUser, cookieHeaders)` and must pass `cookieHeaders` into
`successResponse`. Forgetting that silently drops a refreshed session, and the user gets logged
out on the next request for no visible reason.

Backend gating is independent of the frontend. Route guards in `src/guards/` are UX, not security —
every non-public endpoint needs `withRole`.

## Endpoints

- `api/auth/*` — signin, signup, signout, me, password-reset, update-password, token-exchange
- `api/attempts/index.ts` — `POST` start attempt, `GET` recent attempts (student)
- `api/attempts/[id].ts` — read/save/submit a single attempt (student)
- `api/students/index.ts` — `GET /api/students?q=` student search (supervisor)
- `api/students/[id]/attempts.ts` — a student's attempts (supervisor)

## Shared utilities

- `api/_lib/types.ts` — shared backend types
- `api/_lib/utils/response.ts` — `successResponse` / `errorResponse` builders. Use these; don't
  hand-construct a `Response`.
- `api/_lib/errors/AppError.ts` — structured API errors
- `api/_lib/middleware/*` — `withErrorHandler`, `withAuth`, `withRole`
- `api/_lib/utils/` — `cookies.ts`, `env.ts`, `parseBody.ts`, `uuid.ts`
- `api/_lib/supabaseClient.ts` — Supabase clients (anon + admin)
- `api/_lib/services/offerVerifier.ts` — verifies the email has a qualifying HighLevel payment before signup
- `api/_lib/database.types.ts` — generated Supabase types

## Error contract

The frontend identifies backend errors by their **error code**, not the message. When you add a
new failure mode, add a code — a new message string on an existing code will not reach the UI
correctly, and a bare `throw new Error(...)` becomes a generic 500 with nothing the client can
branch on. Surface errors explicitly rather than returning a success shape with an empty payload.

## TypeScript constraints

`api/` is type-checked by `tsconfig.api.json`: `NodeNext` module resolution, **no DOM types**.

Relative imports must carry a `.js` extension — a Node ESM requirement:

```ts
import { successResponse } from "../_lib/utils/response.js"
```

Omitting it type-checks in some editors but fails at runtime on Vercel. No DOM types means no
`window`, `localStorage`, or DOM `fetch` typings — the global `fetch` is Node's.

Run `npm run typecheck` after backend edits; it builds both projects.

## Local development

`npm run dev` starts Vite only — `/api` routes do not exist. Use `vercel dev` when working on
endpoints.

## Related skills

- **Session creation, role checks, expiry, single-session enforcement → invoke `auth-rbac-guide`.**
  Anything under `api/auth/`, `withAuth`, or `withRole` has rules there that fail dangerously
  (open, rather than closed) when improvised.
- **Writing a query, calling an RPC, or changing a table → invoke `database-guide`.**
- **Consuming the endpoint from React → invoke `frontend-guide`** for `apiFetch` and the
  TanStack Query conventions.
