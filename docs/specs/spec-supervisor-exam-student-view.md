FEATURE: Supervisor can open exams as the student view (actual attempt view)

OVERVIEW:
Supervisors requested that they need to open an actual exam session so they can explain the exam UI to their students during the onboarding process. There shouldn't be a timer, submission, saving, or results. However, all components of a regular examination must be present

ACCEPTANCE CRITERIA:
1. Supervisors can open the exam library page and view a button "View Student Interface" on each exam list item that when pressed, opens a corresponding exam session (full or domain) with no timer, saving, or submission.
2. All UI components are present, even the timer and save/submit buttons, and break behavior. Only difference is that they basically don't work. Session is empheral and never saved to the DB.
3. Supervisors can enter the examination UI without calling any backend, everything is client-side

GENERAL CONSTRAINTS:
1. No backend calling from the new button or during examination.
2. Route is different from the students examination route, same page, different behavior for each role.
3. No if branching inside the examination page, any configuration must be done from a higher level
4. Every component must still be present but not work, timer must be replaced with --:--:-- rather than not displaying.

OUT OF SCOPE:
1. Supervisor attempts, data saving, local storage saving, or any student-related feature change.

EDGE CASES:

VERIFICATION:
Done by the user using black-box testing.


Do not implement until you are sure you know what you will do. If you don't know anything, ask, don't assume.

---

## IMPLEMENTATION DECISIONS (resolved via /grill-me before coding)

### Route + component reuse
- New route `ROUTES.examPreview` (`/exam-preview?id=...`), same query-param shape as `ROUTES.exam` (`?id=`).
- Registered under the **supervisor**-guarded branch in `App.tsx`, rendering `<ExamPage/>` (`ExamSessionRouter`) **verbatim** — same component as the student route. `FullExamProvider`/`DomainExamProvider`/`Timer.tsx`/`DomainTimer.tsx` etc. read `?id=` exactly as today; zero role-awareness added to the exam-page tree itself. All preview-vs-real behavior is driven entirely by what's already sitting in `SessionControlContext` when the tree mounts — never by branching inside the tree.

### Session construction (no backend)
- `SessionControlContext.startNewExam` is rewritten to take a single options object instead of positional params:
  ```ts
  export type StartNewExamParams = {
    type: ExamType
    examOrCategoryId: number
    preview?: boolean // default false
  }
  startNewExam(params: StartNewExamParams): Promise<string | null>
  ```
  All call sites (`StudentDashboardPage.tsx`, new `ExamCard.tsx` button) updated to the object form.
- `BaseSession` gains `preview: boolean`. `DEFAULT_FULL_SESSION`/`DEFAULT_DOMAIN_SESSION` (constants.ts) get `preview: false`. `attemptAdapter.ts`'s `adaptAttemptToSession`/`adaptAttemptToRevision` (real DB-backed sessions) always set `preview: false`.
- When `startNewExam` is called with `preview: true`:
  - Still loads the exam JSON client-side (`loadFullExam`/`loadDomainExam`) to build `questionChoiceOrders`/`questionIds` — unchanged, already client-only.
  - Skips `startAttempt()` (no DB row created). Uses a fixed `PREVIEW_ATTEMPT_ID` constant (`constants.ts`) as the session id instead of a real `attempt_id`.
  - Skips `setLatestAttemptId(...)` — no localStorage write, per OUT OF SCOPE.
  - Builds the session with `paused: true` (so the timer's existing `!paused` interval gate never starts ticking — zero changes needed to `Timer.tsx`/`DomainTimer.tsx`'s interval effects) and `preview: true`.
  - `maxTime`/`time` are still set from the real `durationMinutes` (not a dummy value) — the display is overridden separately (see Timer below), so the underlying number stays realistic and avoids edge cases elsewhere.

### No-DB-write strategy: Strategy pattern (chosen over inline branching)
- New file `src/services/attemptPersistence.ts`:
  ```ts
  export interface AttemptPersistence {
    save(id: string, args: Omit<SaveAttemptInProgress, 'exam_state'>): Promise<void>
    submit(id: string, args: Omit<SaveAttemptCompleted, 'exam_state'>): Promise<void>
  }
  export const remoteAttemptPersistence: AttemptPersistence = { save: saveAttempt, submit: submitAttempt }
  export const noopAttemptPersistence: AttemptPersistence = { save: async () => {}, submit: async () => {} }
  ```
- `useSessionReducer.ts` selects the strategy **once** per session via `useMemo` keyed on `session.preview` — not per-call:
  ```ts
  const persistence = React.useMemo<AttemptPersistence>(
    () => (session.preview ? noopAttemptPersistence : remoteAttemptPersistence),
    [session.preview]
  )
  ```
- `syncProgress`, `saveBreakOffer`, and `submitExam` each swap their one direct `saveAttempt(...)`/`submitAttempt(...)` call for `persistence.save(...)`/`persistence.submit(...)`. No function contains an `if (session.preview)` of its own — the single branch lives in the `useMemo` selecting which strategy object to use. All surrounding logic (dirty-clearing, `isSyncing` toggling, `SET_EXAM_STATE: 'completed'` on submit) is untouched and runs identically for both strategies, since it already executes after the awaited call resolves — so Save/Submit visually behave exactly like a successful real save/submit, they just never reach the DB.
- The existing `session.examType === 'revision'` early-return special-cases in `syncProgress`/`submitExam` are left as-is (out of scope for this feature — revision sessions are a separate, pre-existing ephemeral case).

### Timer — literal "--:--:--"
- `utils/format.ts`: `formatTimer(sec: number, preview = false)` returns `'--:--:--'` when `preview` is true, before the existing formatting logic.
- `useFullExamSession.ts`/`useDomainExamSession.ts` (facade hooks) expose `preview: session.preview`.
- `Timer.tsx`/`DomainTimer.tsx` call `formatTimer(time, preview)` instead of `formatTimer(time)` — a value threaded through, not a branch added inside these components.
- Ticking is stopped for free by `paused: true` at session construction (see above) — no changes to the interval effects themselves.

### Local interactivity (answers, bookmarks, navigation, breaks)
- Answering questions, toggling bookmarks, navigating between questions all work exactly as today (same `dataUpdate`/`navUpdate` dispatches) — fully interactive locally. Only the network-persistence boundary (`syncProgress`/`submitExam`/`saveBreakOffer`) is suppressed.
- Break offer modals (`FullBreakModals`) trigger off **question index** thresholds (60/120), not the timer — confirmed in code (`shouldOfferBreak(n, index, ...)` inside a `useEffect` on `[index]`). Since index navigation stays fully interactive, break offers fire naturally with zero extra code; `recordBreakOffered`'s `saveBreakOffer` call is covered by the same no-op persistence strategy above.
- Submit (confirmed) transitions `examState` to `'completed'` and shows the real summary/results screen, same as a real exam — just via `noopAttemptPersistence.submit()` instead of a network call.

### Entry point: ExamCard
- The card-wide `<Link>` (today wrapping the whole `ExamCard` to exam-detail) is removed. The card becomes two explicit, independent buttons:
  1. **View Questions** — existing behavior, now an actual `<Button>`/`<Link>` rather than the whole card being clickable.
  2. **Preview Exam** — new button. `onClick` calls `startNewExam({ type: exam.type, examOrCategoryId: exam.id, preview: true })` then navigates to `ROUTES.examPreview.to(id)` on success. Shows a per-button inline disabled/spinner state while awaiting (mirrors the brief await even though no network call happens).
- Button label: **"Preview Exam"** / **"عرض الامتحان"**. Added as a new leaf key `exam.library.preview` inside the existing `library` object in `en.json`/`ar.json` (sibling to `view-questions`) — not a new top-level namespace.

### Explicitly out of scope / unchanged
- Revision/retry sessions are unaffected — preview only applies to `full`/`domain`, matching the exam library's two exam kinds.
- No changes to `FullExamProvider.tsx`/`DomainExamProvider.tsx`/`ExamSessionRouter` (`ExamPage.tsx`) — they already work purely off session/context data.
- No new localStorage writes for preview sessions (`setLatestAttemptId` skipped).
