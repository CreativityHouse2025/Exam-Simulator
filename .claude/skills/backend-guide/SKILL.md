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
- **Validation** — zod request schemas, parsed by the handler with `parseOrThrow`
  (`api/_lib/utils/parse.ts`) before the service is called; a failure is a 400 `VALIDATION_ERROR`.
  A schema used by one endpoint lives in that endpoint's file. One shared by several endpoints
  (e.g. `AttemptIdSchema`, `SaveAttemptAnswersSchema`) lives in `shared/schemas/`. Services never
  import from a handler file: a service declares its own input type, and the call site proves the
  parsed request satisfies it.

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
  falls back to `refreshSession` with the refresh token, and forwards refreshed `Set-Cookie`
  headers to the handler. **There is no bypass** — the `BYPASS_AUTH` /
  `BYPASS_AUTH_USER_ID` escape hatch was removed. Sign in with a seeded account instead.
- `withRole` — reads `users.role` with the admin client and **fails closed** with 403 unless the
  role is allowed. A **pure guard**: it does not pass the role to the handler.

Handlers receive `(request, authUser, cookieHeaders)` and must pass `cookieHeaders` into
`successResponse`. Forgetting that silently drops a refreshed session, and the user gets logged
out on the next request for no visible reason.

Backend gating is independent of the frontend. Route guards (`src/routes/RouteGuard.tsx`) are UX, not security —
every non-public endpoint needs `withRole`.

## Endpoints

- `api/auth/*` — signin, signup, signout, me, password-reset, update-password, token-exchange
- `api/attempts/index.ts` — `POST` start attempt (201, `AttemptWithQuestions`), `GET
  ?trackId=&page=&per_page=` one page of the caller's attempts in a track (see **Paged history**).
  Starting an archived exam is 410 `EXAM_ARCHIVED` (the RPC's `archived` sentinel); starting while
  an attempt on that exam is open is 409 `ATTEMPT_IN_PROGRESS` (the RPC's `in_progress` sentinel),
  a plain error with no data. Either way nothing is written
- `api/attempts/[id]/revision.ts` returns `ExamWithQuestions`: the parent exam (`exam`, with its
  config) and the wrong-or-unanswered subset
- `api/attempts/[id].ts` — `GET` read / `PATCH` save a single attempt (owner)
- `api/attempts/[id]/submit.ts` — `POST` submit and grade (owner)
- `api/attempts/[id]/revision.ts` — `GET` the wrong-or-unanswered set (owner)
- `api/exams/[examId]/questions.ts` — `GET` an exam's full disclosed content (supervisor)
- `api/tracks/index.ts` — `GET` the track catalogue
- `api/tracks/[trackId]/tags.ts` — `GET` the track's own tags plus the shared ones (`full`), by
  `display_order`, whether or not they list any exam. Archived tags are left out (both roles,
  `assertTrackAccess`)
- `api/tracks/[trackId]/exams.ts` — `GET ?tag=<code>` one tag's active exams on the track, by
  `display_order` (both roles, `assertTrackAccess`), returned as `{ tag, exams }`. `tag` is required
  (400 if missing); an unknown **or archived** tag is 404 `NOT_FOUND`; a tag with no active exams
  here is `200 { tag, exams: [] }`.
  The service runs `getActiveTag` first, because the exams query filters through the tag join
  (`tags!inner`, `.eq("tags.code", …)`) and cannot tell "unknown" from "empty" on its own.
  Each exam is an `ExamWithProgress`: the caller's `attempts_count` (completed) and
  `open_attempt_id`, from two aliased `exam_attempts` embeds (`completed:…(count)`, `open:…(id)`)
  filtered by user id and state. The admin client bypasses RLS, so **the `user_id` filter is what
  keeps another student's attempts out** — never drop it. No other endpoint returns these fields

Archived content is hidden from **every** role — there is no role branch in the catalog
services. `archived_at` is still returned on `Tag` and `Exam`; the UI does not use it.
- `api/students/index.ts` — `GET /api/students?q=` student search (supervisor)
- `api/students/[id]/attempts.ts` — one page of a student's attempts (supervisor), same paging

### Paged history

Attempts are unlimited (023 dropped the cap). Both history endpoints take `page` (≥ 1, default 1)
and `per_page` (10–100, multiple of 5, default 10), parsed with the shared `AttemptPageSchema`;
anything else is 400. `PER_PAGE_MIN/MAX/STEP` live beside it and also drive the UI's select.

- `listAttempts` returns `{ attempts, total }`, because `total` cannot ride on an array. Newest first, `id` as tie-breaker.
- `total` comes from `count: "exact"` on the same filtered query, so it counts this track only.
- A page past the end makes PostgREST answer 416 `PGRST103` instead of an empty page; only then
  `countAttempts` runs a `head: true` count, and the response is `{ attempts: [], total }`.

## Response shapes

The wire schemas in `shared/schemas/` are the only response shapes. `Exam` **always** carries its
current `config`, including inside an `Attempt`, where `config_snapshot` governs the session and
`exam.config` must not be read (its breaks are unordered there). `ExamWithQuestions` and
`AttemptWithQuestions` are sessions; `ExamList`, `TagList`, `AttemptList`, `TrackList` and
`StudentList` wrap a list.

- **`data` is always an object, never a bare array**, so a response can grow (e.g. `total`)
  without a breaking change.
- **Services return plain values** (`Exam[]`, `Tag[]`, `Attempt[]`, `Exam`). The **handler** wraps
  a list in its `*List` schema: `const result: TagList = { tags: await getTrackTags(trackId) }`.
  The envelope is an HTTP concern; services know nothing about HTTP. The exceptions carry more
  than the list: a paged list, whose service returns `{ attempts, total }` (see **Paged history**),
  and the track exam list, whose service returns `{ tag, exams }`.

## Question content

Four endpoints return question content — start attempt, read attempt, revision, and exam
questions — all through `api/_lib/services/questionService.ts`. Every response carries **every
language**: `text_ar`/`text_en` on questions and choices, `explanation_ar`/`explanation_en` when
disclosed. No content endpoint takes a `lang` parameter; the frontend picks what to display.

`contentColumns(discloseAnswers)` selects `explanation_*` and `is_correct` only when disclosing,
so the answer key cannot leak by omission. The select is assembled at runtime and its row type is
asserted with `overrideTypes`, so **typecheck does not verify the response shape** — check a
changed select against a real response.

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

**The response body carries the code and nothing else.** `ApiError` is `{ success: false, error:
{ code } }` — there is no `message` on the wire. An `AppError`'s message is a *log* line:
`errorResponse` prints it and drops it, so it is free to carry the driver's error text and the
ids involved, and a Postgres message can never reach a network tab. Write messages for whoever
reads the logs, and keep writing them detailed — but never make the client depend on one.

That logging lives in `errorResponse` rather than in `withErrorHandler` on purpose: `withAuth`
answers directly on its refresh-failure paths without going through `withErrorHandler`, so the
response builder is the only chokepoint every failure actually passes through.

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
