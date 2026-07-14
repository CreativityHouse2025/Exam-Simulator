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

- `tsconfig.json` - Solution file only (`files: []`), references `app` and `api`. No compiler options — referenced projects don't inherit them
- `tsconfig.app.json` - Frontend (`src/`): `bundler` module resolution, DOM types, JSX, `noUnusedLocals`/`noUnusedParameters` enabled
- `tsconfig.api.json` - Vercel serverless (`api/`): `NodeNext` module resolution, no DOM types. Relative imports must use `.js` extensions (Node ESM requirement)
- `tsconfig.node.json` - `vite.config.ts` only: `bundler` resolution, `noEmit`. Not a project reference (checked separately via `tsc -p`)

All projects are type-check only (`noEmit: true`, no `composite`); `tsc --build` writes only `.tsbuildinfo` files to `node_modules/.tmp/`. Nothing is emitted to `dist/` — that directory belongs to `vite build` alone.

## Code Style

- Prettier: 120 char line width, 2-space indent, no semicolons
- TypeScript strict mode
- Functional components with hooks
- Styled Components for scoped CSS
- Components should always be created with a mobile-first approach that makes them responsive for all devices
- Should use the theme defined in the constants.ts file for creating components
- Always document newly created major components with JSDoc comments
- Errors throwed from backend are parsed in the frontend using the error code

## Tailwind + styled-components Coexistence (read before touching any Tailwind UI)

New UI (supervisor pages, shadcn primitives) is Tailwind v4. Old UI is styled-components. Both are live
in the same app, which forces two non-obvious constraints. Nearly every "Tailwind looks broken" bug in
this codebase traces back to one of them.

### 1. Preflight is OFF, and always stays off

`src/index.css` imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css` — never
`tailwindcss/preflight.css`. Preflight sets `box-sizing`, `img { display: block }`, and list/table/border
defaults that **nothing in the styled-components pages overrides**, so enabling it globally reflows the
entire existing app.

The cost: browser UA defaults leak into Tailwind markup. `src/index.css` has a hand-written `@layer base`
replacing only the Preflight rules the Tailwind pages actually need. Each rule there is safe because it is
either overridden by an existing styled-component or a no-op for the old pages.

**Cascade layers are what makes this safe, and the rule is per-declaration, not per-file:** styled-components
emit *unlayered* CSS, which beats *any* cascade layer regardless of specificity. So a layered `base` rule can
only ever affect a property that no styled-component declares. Before adding anything to `@layer base`, confirm
the property is already declared by the old components (or is inert for them). That is exactly why full
Preflight is unsafe and the hand-picked subset is not.

Symptoms already hit and fixed — recognise these rather than re-diagnosing them:
- **Serif text / underlined links** → no `body { font-family }`, no `a { text-decoration: inherit }`.
- **Buttons look like raw OS chrome** → UA `background-color: buttonface` + `outset` border.
- **An `outline` button has a heavy near-black border** → Tailwind defaults an uncoloured border to
  `currentColor`. Always pair `border` with an explicit colour (e.g. `border-border`).
- **Content overflows its container** → elements default to `content-box`, but every Tailwind utility
  assumes `border-box`.

### 2. Every Tailwind page root needs `.tailwind-page`

`GlobalStyle` (`src/main.tsx`) sets `html { font-size: 10px }` (`theme.fontSize`), and ~320 `rem` values
across the styled-components are authored against that root. It cannot be changed to 16px.

Two consequences, both already handled — do not "fix" them again:
- Tailwind's default scale is `rem`-based and would render at 62.5%. `src/index.css` restates
  `--spacing`, `--text-*`, `--radius-*` and `--container-*` in **px** so the utilities are root-agnostic.
  `--breakpoint-*` is deliberately left in `rem`: inside a media query, `rem` resolves against the browser's
  initial 16px, not `html`, so breakpoints were never affected.
- The `.tailwind-page` class (defined in `@layer base`) applies `box-sizing: border-box` to a subtree and
  sets a 16px font baseline. **Put it on the root element of every Tailwind-built page.** Without it, unsized
  text inherits 10px and padded elements overflow.

New sizing should use the standard scale (`p-4`, `text-sm`). Do not hand-write `rem` values
(`p-[1.2rem]`) — those bypass the px scale and silently resolve against the 10px root.

### 3. `dark:` variants never fire

The app is light-only, but the shadcn primitives ship `dark:` classes throughout. Tailwind binds `dark:` to
`prefers-color-scheme: dark` by default, so on a dark-mode machine those variants activate and override the
intended light styling — a bug invisible to anyone developing in light mode. `src/index.css` rebinds it:
`@custom-variant dark (&:where(.dark, .dark *))`. Nothing sets `.dark`, so `dark:` is inert. Leave it that way.

### 4. shadcn primitives

Pull them with the real CLI (`npx shadcn add <name>`), never hand-author them. Prefer fixing a shared defect
in the primitive itself (as with `outline`'s missing `border-border`) over patching each call site. Icons in
new UI use `lucide-react`; the existing `@styled-icons/material` usage in old UI stays as-is.

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