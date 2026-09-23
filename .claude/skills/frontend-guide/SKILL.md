---
name: frontend-guide
description: "React/TypeScript architecture for the Exam Simulator app — split context architecture, exam session facade hooks, provider trees per exam type, the session reducer and its persistence rules, TanStack Query server state, dynamic exam/language imports, and Vite fast-refresh constraints. Use this skill whenever touching anything under src/ — components, pages, hooks, providers, contexts, routes, or services — and before adding state, reading session data, creating a provider, wiring a new API read, or changing how an exam session behaves. Also use when a change causes unexpected re-renders, HMR errors, or 'cannot read context' failures. Routes on to styling-guide for any CSS/Tailwind work, auth-rbac-guide for route gating, and exam-data-guide for question banks."
---

# Frontend Guide (React + TypeScript)

## Overview

`src/` is a React 19 + TypeScript SPA built with Vite and React Router 7. Its defining
constraint is that a live exam session must survive navigation and must not re-render the
whole tree on every keystroke of state. Almost every architectural decision below exists to
serve those two goals. Read the relevant section before adding state or a provider — most
"where do I put this?" questions already have an answer here.

## Split Context Architecture

Contexts are deliberately fragmented to minimise re-renders: a component that only needs the
current question index should not re-render when the timer ticks. All context creation and
typed hooks live together in `src/contexts.ts` (that file is not a provider, so multiple
exports are safe there).

| Context | Owns |
| --- | --- |
| `AuthContext` | Current user + auth actions (signIn, signUp, signOut, exchangeToken, password reset/update) |
| `ExamContext` | Current exam questions (read-only), supplied by the per-exam-type provider that owns the route |
| `SettingsContext` | Language, user info (localStorage-backed) |
| `ToastContext` | App-wide toast messages |
| `SessionControlContext` | Lifecycle + persistence: `startNewExam`, `resumeAttempt`, `startRevision`, `saveProgress`, `submitExam`, current session, updater |
| `SessionNavigationContext` | Current question index + updater |
| `SessionTimerContext` | `time`, `maxTime`, `paused` + updater |
| `SessionExamContext` | `examState`, `reviewState`, `categoryId`, `examId` + updater |
| `SessionDataContext` | Bookmarks, selected answers, `examType`, `dirtyQuestions`, `isSyncing`, break offer timestamps + updater |

Read them through the typed hooks in `src/contexts.ts` — `useExam()`, `useSessionControl()`,
`useSessionNavigation()`, `useSessionTimer()`, `useSessionExam()`, `useSessionData()` — never
via raw `React.useContext()`. The hooks throw a clear error when used outside their provider,
which is much easier to debug than a silent `undefined`.

## Exam session facade hooks

Components should not assemble session state from five contexts by hand. `src/hooks/examSession/`
exposes one facade per exam type:

- `useExamSessionCore()` — shared by all three trees: exam data, index, `examState`/`reviewState`,
  bookmarks, answers, `setIndex`, `setAnswer`, `toggleBookmark`
- `useFullExamSession()` — timer, break offers, sync, submit, `startRevision`
- `useDomainExamSession()` — timer, sync, submit (no breaks, no revision)
- `useRevisionExamSession()` — submit only (ephemeral: no timer, no sync)

When behaviour differs by exam type, put it in the matching facade rather than branching inside
a component. That keeps the shared presentation components in `components/exam/shared/` free of
exam-type conditionals, which is the whole point of the split.

## Providers

Routing lives in `src/App.tsx`; every URL comes from `src/config/routes.ts` (dynamic routes
expose `pattern` for `<Route>` and `to()` for links — never hand-build a URL string).

Provider order in `src/main.tsx`:
`SettingsProvider` → `BrowserRouter` → `QueryClientProvider` → `AuthContextProvider` →
`ToastContextProvider` → `App`.

**SessionProvider** sits at the root of the authenticated route branch so a started session
survives navigating from `/` to `/exam`. It owns the whole session lifecycle and *always*
renders all 5 split providers, which keeps `{children}` in a stable tree position — conditional
provider rendering would remount the subtree and lose component state. With no active session,
`SessionControlContext.session` is `null` and `startNewExam` / `resumeAttempt` / `startRevision`
are still callable. Starting a session sets `startingSession`, which resets the reducer via
`RESET_SESSION`.

**ExamPage** (`src/pages/ExamPage.tsx`) reads `session.examType` and delegates:

| Session type | Provider | Tree contents |
| --- | --- | --- |
| `full` | `components/exam/full/FullExamProvider` | session + confirms + break modals |
| `domain` | `components/exam/domain/DomainExamProvider` | session + confirms |
| `revision` | `components/exam/revision/RevisionProvider` | session only (ephemeral) |

Each provider loads its exam JSON, resolves the session's question subset
(`session.questionIds === 'ALL'` or a list of ids), applies `applyQuestionChoiceOrders`, and
supplies `ExamContext`. They re-load on language change. Shared presentation lives in
`components/exam/shared/` (Drawer, Footer, Question, Choice, Layout, Progress, Explanation…) —
put anything reusable there rather than duplicating it per exam type.

## Session reducer and persistence

`src/utils/session.ts` handles immutable state updates with typed actions (`SET_INDEX`,
`SET_ANSWERS`, `SET_TIME`, `SET_TIMER_PAUSED`, `MARK_DIRTY`, `CLEAR_DIRTY`, `RESET_SESSION`,
`SET_BREAK1/2_OFFERED_AT`). Break actions are ignored unless `examType === 'full'`. The reducer
accepts a single action or an array and only allocates a new state object when something actually
changed.

`src/hooks/useSessionReducer.ts` wraps it and owns both the session and the exam content it
belongs to. Rules that are easy to break by accident:

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

Query definitions are centralised in `src/utils/queryOptions.ts`
(`createAttemptsQueryOptions`, `createStudentSearchQueryOptions`, `createStudentAttemptsQueryOptions`)
and call the clients in `src/services/`. Add a new server read as a `queryOptions` factory there
rather than inlining `useQuery` config in a component — that is what keeps cache keys consistent
across the pages that share data.

All requests go through `src/utils/apiFetch.ts`, which converts Vercel 429s into `RateLimitError`
and routes 401s to the registered unauthorized handler. Don't call `fetch` directly.

Backend errors are identified by their **error code**, not their message — see `backend-guide`
for the `AppError` shape the frontend parses.

## Vite fast refresh compliance (critical)

Provider files (`src/providers/*.tsx` and the exam providers under `src/components/exam/*/`)
must have **only a default export** — the React component. Any additional export (hook, styled
wrapper, class-name constant, type) breaks fast refresh and produces HMR violations that look like
random state loss.

The pattern:

1. Contexts and hooks go in `src/contexts.ts` (not a provider file, so multiple exports are fine).
2. Each provider file is **only** the component, default-exported.
3. Shared markup or class names a provider's tree needs live in their own `*Styles.ts(x)` file
   (e.g. `AttemptHistoryStyles.tsx`, `BreakModalsStyles.ts`).

## Dynamic imports and exam loading

Language files are imported per language for code-splitting:

```typescript
import(`./data/langs/${langCode}.json`)
```

Exam data is loaded on demand via `loadFullExam(examId, langCode)` / `loadDomainExam(categoryId, langCode)`.
This happens in two places on purpose:

1. `startNewExam` — loads the file to build question ids and choice orders for the DB insert, then discards it
2. The exam-type provider — re-loads the same file on exam route mount to populate exam data in memory

The duplication is intentional: SessionProvider owns Session state, the exam provider owns exam
data, and Vite's module cache makes the second read effectively free. Don't "optimise" it by
hoisting exam data into the session.

## Supervisor preview sessions

Supervisors can run any exam without touching the DB. `startNewExam({ preview: true })` skips
`startAttempt` and localStorage, uses `PREVIEW_ATTEMPT_ID` and `PREVIEW_TIME_SECONDS`, and the
session gets `noopAttemptPersistence`. Preview routes live under `ROUTES.examPreview` and reuse
the same `ExamPage` tree. Revision is unavailable for preview sessions.

Every supervisor URL is track-scoped (`/exams/:trackId/...`, `/students/:id/tracks/:trackId`),
mirroring `assertTrackAccess` on the API. Access is checked twice on purpose: the page filters to
the supervisor's own `enrolledTracks` so a doomed request is never sent, and the attempts page
also renders a lock state when the API answers `FORBIDDEN` — which is what a deep link or an
enrollment expiring mid-session produces. Leaving an exam routes by role: a supervisor's exit from
a preview goes to `ROUTES.examLibrary`, never to the student-only `/tracks/:id`.

## Page structure — folder per page, no page imports another

Every route component is `src/pages/<kebab-name>/index.tsx`, with its own sub-components beside it
in that folder. There are no loose `XxxPage.tsx` files left in `src/pages/`.

Two rules hold this together, and both are load-bearing:

- **A page never imports from another page.** The moment two pages need the same component, it
  moves to `src/components/<feature>/` — that is how `ExamBrowser`, `ExamFacts`, `TrackLinkCard`,
  `TrackCardSkeleton`, `StudentSummaryCard` and `StudentBreadcrumb` got there.
- **Route composition lives in `App.tsx`, not in a page.** `/` resolves to the supervisor
  dashboard or the student's track list by `roleOf(user)` *inside the router*. There is no
  `HomePage` delegating to two other pages.

Imports inside a page use the `@/` alias rather than `../..` chains.

## Key directories

- `src/components/exam/{full,domain,revision}/` — per-exam-type session trees
- `src/components/exam/shared/` — reusable exam UI
- `src/components/ui/` — shadcn/ui primitives (Tailwind)
- `src/components/{exams,tracks,students,attempts,states}/` — cross-page feature components:
  the exam browser and facts, track cards, student identity/breadcrumb, the attempts table, and
  the shared `EmptyState`/`ErrorState`
- `src/pages/<page>/index.tsx` — one folder per route (see above)
- `src/hooks/examSession/` — exam session facade hooks
- `src/config/` — `routes.ts`, `nav.ts`, `roles.ts`, `icons.ts`
- `src/services/` — frontend API clients; `src/utils/queryOptions.ts` — query definitions

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
