---
name: frontend-guide
description: "React/TypeScript architecture for the Exam Simulator app — the core/components/features/pages/routes folder layout and its import rules, feature barrels (index.ts), split context architecture, the exam session facade hooks, the session reducer and its persistence rules, TanStack Query server state, dynamic language imports, and Vite fast-refresh constraints. Use this skill whenever touching anything under src/ — components, pages, features, hooks, providers, contexts, routes, or services — and before adding a file, deciding where code belongs, adding state, reading session data, creating a provider, wiring a new API read, or changing how an exam session behaves. Also use when a change causes unexpected re-renders, HMR errors, circular-import errors, or 'cannot read context' failures. Routes on to styling-guide for any CSS/Tailwind work, auth-rbac-guide for route gating, and exam-data-guide for question banks."
---

# Frontend Guide (React + TypeScript)

## Overview

`src/` is a React 19 + TypeScript SPA built with Vite and React Router 7. Its defining
constraint is that a live exam session must survive navigation and must not re-render the
whole tree on every keystroke of state. Almost every architectural decision below exists to
serve those two goals. Read the relevant section before adding state or a provider — most
"where do I put this?" questions already have an answer here.

## Folder layout — where code belongs

```
src/
├── main.tsx  App.tsx  index.css
├── assets/  data/                 static files, question banks, translation JSON
├── routes/                        routes.ts, nav.ts, icons.ts, RouteGuard.tsx
├── core/                          shared by more than one feature
│   ├── api/                       apiFetch.ts, apiTypes.ts
│   ├── services/                  API clients used by more than one feature
│   ├── providers/  hooks/  utils/
│   └── contexts.ts  types.ts  constants.ts  errors.ts
├── components/                    global UI with no feature knowledge (+ ui/ shadcn primitives)
├── features/<name>/               auth, exam-session, exams, tracks, attempts, students
│   ├── components/  providers/  hooks/  services/  utils/
│   ├── contexts.ts  types.ts  constants.ts      (only when the feature has them)
│   └── index.ts                   the feature's public API
└── pages/<route>/index.tsx        assembly only — stitches feature and global components together
```

Placement rules:

- **Used by one feature → inside that feature.** Components, hooks, utils, types, query options
  (`services/<name>.queries.ts`) and API clients (`services/<name>.service.ts`).
- **Used by two or more features → `core/`.** This is why `attempt.service.ts` and
  `exams.service.ts` live in `core/services/`, and `localize.ts` in `core/utils/`.
- **UI with no feature knowledge → `components/`.**
- **Pages hold no components of their own.** A page folder is just `index.tsx`; anything it
  renders lives in a feature or in `components/`.

Import rules:

- **Inside a feature, import with relative paths.**
- **From outside a feature, import only from its `index.ts`** (`@/features/exams`), never from a
  file inside it. When something new needs to be reachable from outside, add it to the barrel.
  Default exports are re-exported as named: `export { default as ExamFacts } from "./components/ExamFacts"`.
- **Everything else uses the `@/` alias** (`@/core/...`, `@/components/...`, `@/routes/...`).
- **Leave shadcn defaults alone.** `components/ui/` keeps the CLI-generated imports
  (`@/components/ui/utils`) and `components.json` keeps its aliases, even where they break the
  rules above — a restructure or import cleanup must skip them. Styling edits to primitives follow
  `styling-guide`.
- **Features must not import each other in a cycle.** Barrels turn any two-way dependency into a
  module cycle. If two features need the same code, move it to `core/` rather than importing in
  both directions. Check with `npx madge --circular --extensions ts,tsx --ts-config tsconfig.app.json src`.

## Split Context Architecture

Contexts are deliberately fragmented to minimise re-renders: a component that only needs the
current question index should not re-render when the timer ticks. Each context and its typed hook
live in the `contexts.ts` of whoever owns it (never in a provider file — see fast refresh below):

| Context | File | Owns |
| --- | --- | --- |
| `SettingsContext` | `core/contexts.ts` | Language, user info (localStorage-backed) |
| `ToastContext` | `core/contexts.ts` | App-wide toast messages |
| `AuthContext` | `features/auth/contexts.ts` | Current user + auth actions (signIn, signUp, signOut, exchangeToken, password reset/update) |
| `ExamContext` | `features/exam-session/contexts.ts` | Current exam details + questions (read-only), already localized to the current language by `ExamProvider` |
| `SessionControlContext` | `features/exam-session/contexts.ts` | Lifecycle + persistence: `startNewExam`, `resumeAttempt`, `startRevision`, `saveProgress`, `submitExam`, current session, updater |
| `SessionNavigationContext` | `features/exam-session/contexts.ts` | Current question index + updater |
| `SessionTimerContext` | `features/exam-session/contexts.ts` | `time`, `maxTime`, `paused` + updater |
| `SessionExamContext` | `features/exam-session/contexts.ts` | `examState`, `result` + updater |
| `SessionDataContext` | `features/exam-session/contexts.ts` | Bookmarks, selected answers, `dirtyQuestions`, `offeredBreaks`, `isSyncing` + updater |

Read them through the typed hooks — `useAuth()`, `useSettings()`, `useToast()`, `useExam()`,
`useSessionControl()`, `useSessionNavigation()`, `useSessionTimer()`, `useSessionExam()`,
`useSessionData()` — never via raw `React.useContext()`.

## Exam session facade hooks

Components inside the exam tree should not assemble session state from five contexts by hand.
`features/exam-session/hooks/` exposes two facades:

- `useExamSession()` — the single facade for the exam session tree: exam content, session state,
  config-derived capability flags and the actions components need. No component branches on exam
  type or reads `ExamConfig` directly; a new capability is one line here, not a branch in every
  consumer.
- `useExamTimer()` — the clock, split out on purpose. It is the only hook that subscribes to
  `SessionTimerContext`'s 1Hz tick, so only components that render the clock (Timer,
  TimerConfirms, BreakModals, the pause menu item) use it. Everything else stays off the tick.

## Providers

Routing lives in `src/App.tsx`; every URL comes from `src/routes/routes.ts` (dynamic routes
expose `pattern` for `<Route>` and `to()` for links — never hand-build a URL string).

Provider order in `src/main.tsx`:
`SettingsProvider` → `BrowserRouter` → `QueryClientProvider` → `AuthContextProvider` →
`ToastContextProvider` → `App`.

**SessionProvider** (`features/exam-session/providers/`) sits at the root of the authenticated
route branch so a started session survives navigating from `/` to `/exam`. It owns the whole
session lifecycle and *always* renders all 5 split providers, which keeps `{children}` in a stable
tree position — conditional provider rendering would remount the subtree and lose component state.
With no active session, `SessionControlContext.session` is `null` and `startNewExam` /
`resumeAttempt` / `startRevision` are still callable. Starting a session sets `startingSession`,
which resets the reducer via `RESET_SESSION`.

**ExamPage** (`src/pages/exam/index.tsx`) renders one config-driven shell for every exam type
(`ExamSession`, plus `TimerConfirms` when timed and `BreakModals` when the config has breaks). It
never resolves a session — a cold hit of `/exam` redirects home.

**ExamProvider** (`features/exam-session/providers/ExamProvider.tsx`) sits inside SessionProvider
and supplies `ExamContext`. It never fetches; see "Exam content and language" below.

## Session reducer and persistence

`features/exam-session/utils/session.ts` handles immutable state updates with typed actions
(`SET_INDEX`, `SET_ANSWERS`, `SET_TIME`, `SET_TIMER_PAUSED`, `MARK_DIRTY`, `CLEAR_DIRTY`,
`RESET_SESSION`, `SET_OFFERED_BREAK`, …). The reducer accepts a single action or an array and only
allocates a new state object when something actually changed.

`features/exam-session/hooks/useSessionReducer.ts` wraps it and owns both the session and the exam
content it belongs to. Rules that are easy to break by accident:

- **Atomic mount** — `mountSession(session, examContext)` is the only way either is set, and it
  writes both in one commit. Start, resume, revision and the post-submit re-mount all end in one
  of those calls. Never hold a setter for one alone: a render that pairs a new question list with
  the previous session's answers paints the old attempt's state onto the new exam, because answers
  are indexed by position into the question list. This is also why the reset is a direct dispatch
  and not an effect — an effect lands a render late, which is exactly the frame to avoid.
- **Dirty tracking** — only questions marked dirty are sent on save; `CLEAR_DIRTY` fires on success.
- **Sync guard** — `isSyncingRef` drops component-dispatched actions while a save is in flight, so
  an answer changed mid-request isn't wiped by the `CLEAR_DIRTY` that follows. Internal dispatches
  bypass the guard.
- **Submit ordering** — `submitExam` only transitions to `completed` after a successful write
  (revision sessions transition locally with no DB call). Never flip the state optimistically;
  a failed write with a `completed` UI loses the attempt.
- **One write path** — `saveProgress({ offeredBreak? })` is the only in-progress write: dirty
  answers, position, clock and a break offer all travel in the same PATCH. An empty answer diff is
  still sent, because the position and the clock move without any question going dirty. A break
  offer is recorded locally first and always, even for a session that never persists.

A session that never persists (`session.preview` — supervisor preview and revision) short-circuits
inside `saveProgress` / `submitExam`, so no caller branches on it.

## Server state (TanStack Query)

Query definitions live in each feature's `services/<name>.queries.ts`
(`createAttemptsQueryOptions` in attempts, `createStudent*QueryOptions` in students,
`createTracksQueryOptions` in tracks, `createTrackExamsQueryOptions` /
`createExamQuestionsQueryOptions` in exams) and are exported through the feature's `index.ts`.
Add a new server read as a `queryOptions` factory there rather than inlining `useQuery` config in a
component — that is what keeps cache keys consistent across the pages that share data.

All requests go through `core/api/apiFetch.ts`, which converts Vercel 429s into `RateLimitError`
and routes 401s to the registered unauthorized handler. Don't call `fetch` directly.

Backend errors are identified by their **error code**, not their message — see `backend-guide`
for the `AppError` shape the frontend parses.

## Vite fast refresh compliance (critical)

Provider files (`core/providers/*.tsx`, `features/*/providers/*.tsx`) must have **only a default
export** — the React component. Any additional export (hook, context, class-name constant, type)
breaks fast refresh and produces HMR violations that look like random state loss.

The pattern:

1. Contexts and their hooks go in the owner's `contexts.ts` (not a provider file, so multiple
   exports are fine).
2. Each provider file is **only** the component, default-exported. The feature's `index.ts`
   re-exports it as named — that is fine, the barrel is not a component file.
3. Shared markup or class names a provider's tree needs live in their own `*Styles.ts(x)` file
   (e.g. `features/exam-session/components/breaks/BreakModalsStyles.ts`).

## Exam content and language

UI strings are imported per language for code-splitting:

```typescript
import(`./data/langs/${langCode}.json`)
```

Exam content comes from the API in **every language at once** — questions carry
`textAr`/`textEn`, `explanationAr`/`explanationEn` and choice `textAr`/`textEn`; exam names are
`BilingualText`. No content request takes a language.

- **Storage** — `useSessionReducer` holds the bilingual content (`ExamContent` type) next to the
  session, set only through `mountSession`. Nothing about content is in localStorage.
- **Localization** — `ExamProvider` reads `settings.language` and maps the content through
  `localizeQuestion` / `localizeExamDetails` (`core/utils/localize.ts`) in a `useMemo`.
  `ExamContext` therefore holds `Localized<…>` types: `text`, `explanation`, `name` are plain
  strings and the per-language fields are gone.
- **Switching language mid-exam** re-runs only that map. No fetch, and the session (answers,
  index, timer) is untouched — which is why the header toggle is never locked.

The rule: **exam UI children never pick a language for content.** They read `question.text`,
never `textAr`/`textEn` (the `Localized` type removes them, so the compiler enforces it). Only the
owner of the content localizes — `ExamProvider` for sessions, the page for the supervisor question
viewer (`pages/exam-detail`, which localizes per rendered card and searches both languages).
Language-dependent UI chrome (choice letters, `dir`) is not content and may read settings.

## Supervisor preview sessions

Supervisors can run any exam without touching the DB. `startNewExam({ preview: true })` skips
`startAttempt` and localStorage, uses `PREVIEW_ATTEMPT_ID` (`features/exam-session/constants.ts`),
and the session never persists. Preview routes live under `ROUTES.examPreview` and reuse the same
`ExamPage` tree. Revision is unavailable for preview sessions.

Every supervisor URL is track-scoped (`/exams/:trackId/...`, `/students/:id/tracks/:trackId`),
mirroring `assertTrackAccess` on the API. Access is checked twice on purpose: the page filters to
the supervisor's own `enrolledTracks` so a doomed request is never sent, and the attempts page
also renders a lock state when the API answers `FORBIDDEN` — which is what a deep link or an
enrollment expiring mid-session produces. Leaving an exam routes by role: a supervisor's exit from
a preview goes to `ROUTES.examLibrary`, never to the student-only `/tracks/:id`.

## Pages — assembly only, no page imports another

Every route component is `src/pages/<kebab-name>/index.tsx`, and that is the only file in the
folder. Two rules hold this together:

- **A page never imports from another page, and owns no components.** Whatever it renders comes
  from a feature barrel or `components/`.
- **Route composition lives in `App.tsx`, not in a page.** `/` resolves to the supervisor
  dashboard or the student's track list by `roleOf(user)` (exported from `@/features/auth`)
  *inside the router*. There is no `HomePage` delegating to two other pages.

## Related skills — read these before you write the code

This skill covers structure and state. Three areas have their own hard-won constraints and
routinely break when improvised:

- **Any CSS, Tailwind class, theme token, or shadcn primitive → invoke `styling-guide` first.**
  Tailwind v4 is the only styling system, and its non-obvious rules here (where tokens must be
  declared to generate utilities, the `@layer base` heading reset, when plain CSS is allowed) are
  what make improvised markup render wrong.
- **Route guards, role gating, nav items, or anything touching who can see what → invoke `auth-rbac-guide`.**
- **Question banks, exam definitions, category lists, or fixing an answer → invoke `exam-data-guide`.**
- **Calling or adding an API endpoint → invoke `backend-guide`** for the error-code contract and
  endpoint list.
