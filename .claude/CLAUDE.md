# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Simulator is a bilingual (Arabic/English) PMP exam practice application built for Creativity House. It supports full 180-question predefined exams (with some exams more or less than 180), category exams (all questions from a selected PMP domain), and a retry session for incorrect/unanswered questions.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
vercel dev        # Start Vercel dev server that enables /api endpoints
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run format    # Format code with Prettier
npm run typecheck # Type-check the entire project (tsc --build + vite config)
```

## Technology Stack

- React 19 + TypeScript 5.9 with Vite (SWC)
- Styled Components for CSS-in-JS
- React Context API for state (split into 5 contexts for performance)
- Vercel serverless functions (`/api`) for backend features
- Mantine hooks for localStorage persistence

## Backend and Frontend Architecture

All API endpoints follow a three-layer pattern:

- **Handler** (`api/*.ts`): parses and validates the request, calls the service, returns the HTTP response. No business logic.
- **Service** (`api/_lib/services/`): contains all business logic. No knowledge of HTTP — no `req`, `res`, or status codes.
- **Validation** (`api/_lib/validators/`): pure functions that validate and parse request input. Called by the handler before the service.

Keep handlers thin. If logic can be unit tested without mocking an HTTP request, it belongs in the service.

### Split Context Architecture (React)
Contexts are separated to minimize re-renders. All context creation and typed hooks are co-located in `src/contexts.ts` for Vite fast refresh compliance:

**Contexts:**
- `ExamContext` - Current exam questions (read-only). Loaded by `ExamContextProvider` on `/app/exam` mount based on session config.
- `SessionNavigationContext` - Current question index and updater
- `SessionTimerContext` - Time tracking (time, maxTime, paused) and updater
- `SessionExamContext` - Exam state (in-progress, completed, review) and updater
- `SessionDataContext` - Answers, bookmarks, examType, isSyncing state and updater
- `SessionControlContext` - Lifecycle methods: startNewExam, resumeAttempt, startRevision, current session, updater
- `SettingsContext` - Language, user info (localStorage-backed)

**Typed Hooks (all in `src/contexts.ts`):**
- `useExam()` - Read exam data from ExamContext; throws if undefined
- `useSessionControl()` - Access Session lifecycle and current session
- `useSessionNavigation()` - Read/update question index
- `useSessionTimer()` - Read/update timer state
- `useSessionExam()` - Read/update exam state (in-progress, completed, review)
- `useSessionData()` - Read/update answers, bookmarks, examType, isSyncing
- Use these hooks instead of raw `React.useContext()` calls for better type safety and error checking.

### Provider Hierarchy
```
ProtectedRoute
  └── SessionProvider                    ← wraps /history AND /app/*
        ├── /history    AttemptHistoryPage    (calls resumeAttempt)
        └── /app
              ├── index    CoverPage           (calls startNewExam)
              └── /exam    ExamContextProvider ← loads exam JSON
                              └── ExamPage
```

**SessionProvider** owns the full Session lifecycle. On mount it provides `startNewExam`, `resumeAttempt`, and `startRevision` to child routes without requiring an active session. When any of these succeed, SessionProvider mounts the `ActiveSession` component which wires up the 5 split contexts.

**ExamContextProvider** wraps only `/app/exam`. On mount it reads `session.examType`, `session.examId`, and `session.categoryId` from `SessionControlContext`, then loads the corresponding exam JSON via `loadFullExam` or `loadDomainExam`. It re-loads on language change.

### Session Reducer (React)
`src/utils/session.ts` handles immutable state updates with typed actions (SET_INDEX, SET_ANSWERS, SET_TIME, SET_TIMER_PAUSED, etc.). Note: `Session.questions` field was removed — it was written at init but never read during a session; `useExamSession` always reads question data from the exam context instead.

### Vite Fast Refresh Compliance (Critical)
Provider files (`src/providers/*.tsx`) must have **only a default export** — the React component. All additional exports (hooks, styled components, types) break Vite's fast refresh and cause HMR violations.

Pattern for context creation:
1. Create contexts and hooks in a single file (`src/contexts.ts`) — this file is not a provider, so it can export multiple items
2. Each provider file (`ExamContextProvider.tsx`, `SessionProvider.tsx`) is **only** the component, default-exported
3. Styled components specific to a provider live in their own `*Styles.ts` file (e.g., `AttemptHistoryStyles.ts`) if shared with other components

This ensures each provider component can be fast-refreshed independently when edited.

### Dynamic Imports and Exam Loading (React)
Language files are dynamically imported per language for code-splitting:
```typescript
import(`./data/langs/${langCode}.json`)
```

**Exam data:** Each full exam and each category has its own JSON file. Exams are loaded on demand via `loadFullExam(examId, langCode)` or `loadDomainExam(categoryId, langCode)`. This happens in two places:
1. `startNewExam` — loads the file to extract question count for the DB insert, then discards it
2. `ExamContextProvider` — re-loads the same file on `/app/exam` mount to populate exam data in memory

This duplication is intentional: it keeps the responsibility boundary clean (SessionProvider owns Session state, ExamProvider owns exam data). If duplicate reads become a perf concern, a small cache in `loadFullExam`/`loadDomainExam` is a follow-up.

## Single Session Enforcement

Each user account is limited to one active session at a time. This prevents account sharing across devices.

### Sign-in flow (force flag pattern)

The sign-in handler accepts a `force` boolean alongside email and password. Three cases:

1. **`force: false`, no conflict:** `signInWithPassword` → assert `user.id` non-null → RPC returns 1 → fetch profile → check expiry → return profile + cookies
2. **`force: false`, conflict:** `signInWithPassword` → assert `user.id` non-null → RPC returns ≥ 2 → `admin.signOut(newJWT, 'local')` → throw `SESSION_CONFLICT`
3. **`force: true`:** `signInWithPassword` → assert `user.id` non-null → `admin.signOut(newJWT, 'others')` (no RPC needed) → fetch profile → check expiry → return profile + cookies

The `user.id` null assertion guards against the RPC silently returning 0 on `WHERE user_id = NULL`, which would bypass enforcement entirely.

On RPC failure: fail-closed — signOut local, throw internal error. Never silently proceed as "no conflict."

### Session entry points

All paths that create a row in `auth.sessions`:
- **Sign In** — covered by force flag + RPC
- **Password Reset (token-exchange, type=recovery)** — covered by unconditional `signOut("others")` in `confirmMagicLinkSignin`
- **Email Confirmation (token-exchange, type=signup)** — covered by the same unconditional `signOut("others")` (no-op when no other sessions exist; kept unconditional to prevent type-spoofing bypass)


## Key Directories

- `src/components/Navigation/` - Main exam interface with drawer, footer, timer
- `src/components/Content/` - Question rendering, results summary
- `src/data/exam/` - Question banks, exam definitions, categories
- `src/data/langs/` - Translation JSON files (ar.json, en.json)
- `api/_lib/types.ts` - Shared backend types
- `api/_lib/utils/responses.ts` - Used to return a failure and success structure response for APIs
- `api/_lib/errors/AppError.ts` - Custom error class for structured API errors
- `api/_lib/middleware/*` - Has HOFs that wraps handlers with consistent error formatting and authentication assertion
- `api/_lib/validators/authValidator.ts` - Input validation for auth endpoints (throws `AppError` on failure)
- `api/_lib/services/subscriptionVerifier.ts` - Verifies user has an active HighLevel subscription before signup

## TypeScript Configuration

Project uses split tsconfig with project references to separate frontend and backend environments:

- `tsconfig.json` - Root config with shared options, references `app` and `api`
- `tsconfig.app.json` - Frontend (`src/`): `bundler` module resolution, DOM types, JSX, `noUnusedLocals`/`noUnusedParameters` enabled
- `tsconfig.api.json` - Vercel serverless (`api/`): `Node16` module resolution, no DOM types. Relative imports must use `.js` extensions (Node ESM requirement)
- `tsconfig.vite.json` - Vite config only: `bundler` resolution, `allowJs`, `noEmit`. Not a project reference (checked separately via `tsc -p`)

## Code Style

- Prettier: 120 char line width, 2-space indent, no semicolons
- TypeScript strict mode
- Functional components with hooks
- Styled Components for scoped CSS
- Components should always be created with a mobile-first approach that makes them responsive for all devices
- Should use the theme defined in the constants.ts file for creating components
- Always document newly created major components with JSDoc comments
- Errors throwed from backend are parsed in the frontend using the error code

## Workflow
- After completing any coding task, update `todo.md` in the project root with the next steps if applicable. Keep entries concise and actionable.
- After completing major changes in the app's architecture/components, update this `CLAUDE.md` file to match it.
- If you notice there are repeatable work that needs context to start with

## Guidelines and Constraints (CRITICAL, SHOULD NEVER OVERLOOK)

### 1. Think Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.
### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No "flexibility" or "configurability" that wasn't requested.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.
When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"
For multi-step tasks, state a brief plan:

``` text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 5. Reusability and code extraction

Prefer reusing existing logic, components, or styling over starting from scratch, even if needed to refactor the existing code to be more flexible.