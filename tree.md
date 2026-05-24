# Exam Session Component Tree

Annotated from `SessionProvider` down to every leaf rendered during an active exam. Each node lists its **purpose**, **responsibility**, and which **exam types** it applies to.

Legend: `[full]` `[domain]` `[revision]` `[all]`

------------------------------------------------------------------------

## SessionProvider `src/providers/SessionProvider.tsx` `[all]`

**Purpose:** Owns the full session lifecycle. The single source of truth for session state.

**Responsibilities:** - Holds `startingSession` (the session last started or resumed) - Exposes lifecycle methods: `startNewExam`, `resumeAttempt`, `startRevision` - Drives the session reducer via `useSessionReducer` - Wires reducer slices into the 5 split context providers - Renders `SyncOverlay` when `isSyncing` is true - All 5 context providers are always mounted (stable tree position for sibling routes)

**Mounts 5 context providers (always present, regardless of exam type):**

| Context | Slice |
|------------------------------------|------------------------------------|
| `SessionControlContext` | `session`, `startNewExam`, `resumeAttempt`, `startRevision`, `syncProgress`, `submitExam`, `saveBreakOffer` |
| `SessionNavigationContext` | `index`, `update` |
| `SessionTimerContext` | `time`, `maxTime`, `paused`, `update` |
| `SessionExamContext` | `examState`, `reviewState`, `categoryId`, `examId`, `update` |
| `SessionDataContext` | `bookmarks`, `selectedOriginalIndices`, `examType`, `dirtyQuestions`, `break1OfferedAt`, `break2OfferedAt`, `isSyncing`, `update` |

**Coupling issue:** `SessionTimerContext` carries `time`/`maxTime`/`paused` and `SessionDataContext` carries `break1OfferedAt`/`break2OfferedAt` — fields that only have meaning for `[full]` exams. They are mounted for all exam types and unused or set to null unconditionally.

------------------------------------------------------------------------

└── **SyncOverlay** `src/components/SyncOverlay` `[full]` `[domain]`

    **Purpose:** Fullscreen overlay shown while progress is being persisted to the DB.

    **Responsibilities:** Renders a blocking overlay when `isSyncing` is true. Not shown for `[revision]` (revision is ephemeral, never synced).

------------------------------------------------------------------------

└── **children** (router outlet — `/app/exam` renders `ExamContextProvider`)

------------------------------------------------------------------------

## ExamContextProvider `src/providers/ExamProvider.tsx` `[all]`

**Purpose:** Loads exam data from disk and holds it in `ExamContext`. The single owner of the in-memory question list.

**Responsibilities:** - Reads `session.examType`, `session.examId`, `session.categoryId`, `session.questionIds` from context - Calls `loadFullExam` (`[full]`, `[revision]`) or `loadDomainExam` (`[domain]`) on mount and on language change - Applies `session.questionIds` to subset/reorder questions (resume from DB + revision paths) - Applies `applyQuestionChoiceOrders` to produce the final shuffled exam - Guards `useUnsavedChangesWarning` — only active for non-revision in-progress sessions - Shows `<Loading />` until the first exam load completes - Renders `<Confirms />` and `<BreakModals />` as siblings to children

**Coupling issue:** Renders `<BreakModals />` for all exam types; `BreakModals` self-guards on `examType !== 'full'`. `<Confirms />` contains timer-expiry logic only relevant to `[full]`.

------------------------------------------------------------------------

### BreakModals `src/components/Navigation/BreakModals.tsx` `[full]` only

**Purpose:** Orchestrates the two optional mid-exam break offers (Q61, Q121).

**Responsibilities:** - Watches `index` — triggers offer when crossing break thresholds (60, 120) for the first time - Persists offer timestamps via `saveBreakOffer` (DB + reducer in one call) - Pauses the exam timer when a break is taken; resumes on end/skip - Runs a 10-minute break countdown, auto-dismisses at zero - Self-guards: returns `null` when `examType !== 'full'` or `examState !== 'in-progress'`

    └── **BreakOfferModal** `src/components/Navigation/BreakOfferModal.tsx`

        **Purpose:** Modal UI asking the user to accept or skip a break.

        **Responsibilities:** Purely presentational. Emits `onTake` or `onSkip`.

    └── **BreakTimerModal** `src/components/Navigation/BreakTimerModal.tsx`

        **Purpose:** Modal UI displaying the break countdown.

        **Responsibilities:** Purely presentational. Shows time remaining, a progress arc, and an "End Break" button. Emits `onEnd`.

------------------------------------------------------------------------

### Confirms `src/components/Navigation/Confirms.tsx` `[full]` `[domain]` `[revision]`

**Purpose:** Renders confirmation modals for timer expiry and exam pause.

**Responsibilities:** - `expired` modal: shown when `timerHaveExpired` — calls `submitExam` on confirm (which has an internal examType !== revision guard). Relevant only for `[full]` and currently domain exams. - `pause` modal: shown when `timerIsPaused` — resumes timer on confirm. - Derives `results` from `useResults` to pass `score`/`status` to `submitExam`.

**Coupling issue:** The `expired` modal path is only reachable for `[full]` exams, but `Confirms` is rendered for all exam types inside `ExamContextProvider`.

------------------------------------------------------------------------

└── **children** (the exam page UI — `NavigationComponent`)

------------------------------------------------------------------------

## NavigationComponent `src/components/Navigation/index.tsx` `[all]`

**Purpose:** Top-level layout shell for the active exam screen.

**Responsibilities:** - Reads exam length from `ExamContext` - Tracks `open` (drawer visibility) and responds to mobile breakpoint via `useMediaQuery` - Composes the three layout regions: `Drawer`, `Content`, `Footer`

------------------------------------------------------------------------

### Drawer `src/components/Navigation/Drawer/index.tsx` `[all]`

**Purpose:** Collapsible side panel for question navigation and exam actions.

**Responsibilities:** - Animates width between `30rem` (open) and `5rem` (collapsed) - Renders `Control` (toggle button) and `Menu` (navigation + actions)

------------------------------------------------------------------------

#### Control `src/components/Navigation/Drawer/Control.tsx` `[all]`

**Purpose:** Toggle button to open/close the drawer.

**Responsibilities:** Purely presentational. Emits `toggleOpen`.

------------------------------------------------------------------------

#### Menu `src/components/Navigation/Drawer/Menu.tsx` `[all]`

**Purpose:** Vertical list of filter options, exam actions, and the question grid.

**Responsibilities:** - Builds `menuItems` based on `examState`: - `in-progress`: filters (all, marked, incomplete, complete) + grid + pause + stop - `completed`: filters (all, marked, incomplete, incorrect, correct) + grid + summary - `pause` action: calls `SET_TIMER_PAUSED true` (only meaningful for `[full]`) - `stop` action: opens submit confirmation modal, then calls `submitExam` - `summary` action: navigates to summary view post-completion - Hosts the submit confirmation `<Modal />`

**Coupling issue:** The `pause` action reads from `SessionTimerContext` and dispatches a timer action — this is dead functionality for `[domain]` and `[revision]` exams where no real timer is paused.

------------------------------------------------------------------------

##### Legends `src/components/Navigation/Drawer/Legends.tsx` `[all]`

**Purpose:** Displays the colour-coded legend above the question grid.

**Responsibilities:** Renders a row of `<Legend />` items.

------------------------------------------------------------------------

###### Legend `src/components/Navigation/Drawer/Legend.tsx` `[all]`

**Purpose:** A single legend entry (icon + label).

**Responsibilities:** Purely presentational.

------------------------------------------------------------------------

##### Grid `src/components/Navigation/Drawer/Grid.tsx` `[all]`

**Purpose:** Scrollable grid of question cells, filtered by the active filter.

**Responsibilities:** - Derives answer status (answered, correct, incorrect, incomplete) from `selectedOriginalIndices` + `exam` - Filters visible cells by the active `QuestionFilter` - Renders a `<Cell />` per visible question index

------------------------------------------------------------------------

###### Cell `src/components/Navigation/Drawer/Cell.tsx` `[all]`

**Purpose:** A single clickable question number in the grid.

**Responsibilities:** - Shows answered/bookmarked status via colour/icon - Navigates to the question on click via `SET_INDEX`

------------------------------------------------------------------------

### Content `src/components/Content/index.tsx` `[all]`

**Purpose:** Switches between the active exam view and the summary view.

**Responsibilities:** - If `examState === 'completed'` and `reviewState === 'summary'`: renders `<Summary />` - Otherwise: renders `<ExamComponent />` - Passes `examType` to `<Summary />`

------------------------------------------------------------------------

#### Summary `src/components/Content/Summary.tsx` `[full]` `[domain]`

**Purpose:** Post-exam results screen.

**Responsibilities:** - Reads results from `useResults` (score, pass/fail, elapsed time, counts) - Renders result rows via `<SummaryRow />` - Shows "Retake mistakes" button only when `canRetryAttempt(examType, hasWrongAnswers)` is true — `[full]` only - Shows pass/fail status and passing percentage when defined (exam-config-dependent) - "Home" button navigates to `/` - "Retake" button calls `startRevision(attemptId)` and navigates to `/app/exam`

**Coupling issue:** `canRetryAttempt` conditional is the only exam-type branch here — `[domain]` and revision always get the simpler action view. This is a prime candidate for splitting into two separate components.

------------------------------------------------------------------------

##### SummaryRow `src/components/Content/SummaryRow.tsx` `[all]`

**Purpose:** A single labelled stat row in the summary.

**Responsibilities:** Purely presentational. Renders icon + label + value with optional pass/fail colour coding.

------------------------------------------------------------------------

#### ExamComponent `src/components/Content/Exam.tsx` `[all]`

**Purpose:** The active question view (both in-progress and review modes).

**Responsibilities:** - Reads current question from `ExamContext` by `index` - Renders `<TopDisplay />`, optional `<Progress />`, `<Question />`, `<MultipleChoice />`, optional `<Explanation />` - `<Progress />` hidden when `isReview` is true - `<Explanation />` shown only when `isReview` is true

**Coupling issue:** `Explanation` is review-only here. The new domain feature requires it to be accessible mid-exam (before the exam is submitted). This is the primary driver for the component split.

------------------------------------------------------------------------

##### TopDisplay `src/components/Content/TopDisplay.tsx` `[all]`

**Purpose:** Question header — shows question number, exam/category chip, and action buttons.

**Responsibilities:** - Reads `index`, `categoryId`, `examId`, `examType` - Resolves exam label via `useFullExamLabel` (`[full]`) or `useCategoryLabel` (`[domain]`) - Renders chip as "Exam: X" for `[full]` or "Category: X" for `[domain]`/`[revision]` - Renders `<SaveButtonWithReminder />` only when `!isReview && examType !== 'revision'` - Renders `<BookmarkButton />` when not in review mode

**Coupling issue:** Multiple exam-type conditionals in one component — chip label logic, save button visibility (visible to domain and full only). These naturally separate into two distinct TopDisplay variants.

------------------------------------------------------------------------

###### SaveButtonWithReminder `src/components/Content/SaveButtonWithReminder.tsx` `[full]` `[domain]`

**Purpose:** Manual save trigger with an auto-appearing reminder tooltip.

**Responsibilities:** - Calls `syncProgress` on click - Disabled while `isSyncing` or no dirty questions exist - Shows an "initial" reminder tooltip on first render - Shows an "unsaved" reminder tooltip every 5 newly dirty questions - Reminder can be silenced for the session via a checkbox - Not rendered for `[revision]` (controlled by parent `TopDisplay`)

------------------------------------------------------------------------

###### BookmarkButton `src/components/Content/Bookmark.tsx` `[all]`

**Purpose:** Toggle a bookmark on the current question.

**Responsibilities:** - Reads/updates `bookmarks` array and marks question dirty via `SET_ANSWERS` + `MARK_DIRTY` - Purely question-scoped — no exam-type awareness

------------------------------------------------------------------------

##### Progress `src/components/Content/Progress.tsx` `[full]` `[domain]`

**Purpose:** Shows how many questions have been answered out of the total.

**Responsibilities:** - Counts answered questions from `selectedOriginalIndices` - Displays as "✍️ X (Y%)" - Not rendered during review mode (controlled by parent `ExamComponent`)

------------------------------------------------------------------------

##### Question `src/components/Content/Question.tsx` `[all]`

**Purpose:** Renders the question text and any supporting media.

**Responsibilities:** Purely presentational — receives question props, renders text. No exam-type awareness.

------------------------------------------------------------------------

##### MultipleChoice `src/components/Content/MultipleChoice.tsx` `[all]`

**Purpose:** Renders the list of answer choices and handles selection.

**Responsibilities:** - Maps displayed choice index to original (shuffled) index via `originalIndex` - Enforces max selections equal to `question.answer.length` - Toggles selection: deselects if already chosen, selects if capacity remains - Dispatches `SET_ANSWERS` + `MARK_DIRTY` on each change - Disables all choices when `isReview` is true - Renders a `<Choice />` per choice

------------------------------------------------------------------------

###### Choice `src/components/Content/Choice.tsx` `[all]`

**Purpose:** A single answer option button.

**Responsibilities:** - Shows selected, correct, incorrect visual states - Applies radio-button style for single-answer questions, checkbox style for multi-answer - Disabled when `isReview` or max choices reached - Purely presentational beyond click emission

------------------------------------------------------------------------

##### Explanation `src/components/Content/Explanation.tsx` `[all]`

**Purpose:** Shows the correct answer and explanation after the exam is submitted.

**Responsibilities:** - Computes `isAnswerCorrect(userAnswer, question.answer)` - Displays user's result status (correct/incorrect), the correct answer label, and optional explanation text - Currently only rendered post-submission (review mode) via parent `ExamComponent`

**Pending change:** For `[domain]` exams, this component needs to be accessible mid-exam via a "Show Answer" button — currently blocked by the `isReview` gate in `ExamComponent`.

------------------------------------------------------------------------

### Footer `src/components/Navigation/Footer/index.tsx` `[all]`

**Purpose:** Bottom navigation bar.

**Responsibilities:** - Renders `<Arrows />` and `<Timer />` side by side in a two-column grid - Passes `questionCount` to `Arrows`

**Coupling issue:** `<Timer />` is always rendered regardless of exam type. For `[domain]` and `[revision]` the timer display is meaningless if no time-pressure mechanic exists.

------------------------------------------------------------------------

#### Arrows `src/components/Navigation/Footer/Arrows.tsx` `[all]`

**Purpose:** Previous/next/skip-to-start/skip-to-end navigation controls.

**Responsibilities:** - Four directional buttons: first, previous, next, last - Respects document `dir` (LTR/RTL icon swap) - Disabled at boundaries (index 0 or last question) - Dispatches `SET_INDEX` on click

------------------------------------------------------------------------

#### Timer `src/components/Navigation/Footer/Timer.tsx` `[full]`

**Purpose:** Countdown display showing remaining exam time.

**Responsibilities:** - Reads `time`, `paused`, `examState` from context - Runs a `setInterval` that decrements `time` every second while not paused and not completed - Clears interval on pause, completion, or unmount - Shows warning colour when under 2 minutes remaining - Relevant only for `[full]` exams; always mounted but functionally inert for `[domain]`/`[revision]`

------------------------------------------------------------------------

## Summary: Exam-Type Coupling Map

| Component | `[full]` | `[domain]` | `[revision]` | Coupling issue |
|---------------|---------------|---------------|---------------|---------------|
| `SessionTimerContext` fields | used | mounted but inert | mounted but inert | Timer fields on shared context |
| `break1/2OfferedAt` | used | mounted but inert | mounted but inert | Break fields on shared context |
| `BreakModals` | active | self-guards, returns null | self-guards, returns null | Mounted for all, guards internally |
| `Confirms` (expired path) | reachable | dead | dead | Timer expiry irrelevant without real pressure |
| `Timer` | countdown | displays 0/inert | displays 0/inert | Always rendered |
| `Menu` pause action | functional | dispatches to dead state | dispatches to dead state | Timer pause action has no effect |
| `TopDisplay` chip/label | exam label | category label | exam label | Branching label logic in one component |
| `TopDisplay` save button | shown | shown | hidden | `examType !== 'revision'` guard |
| `SaveButtonWithReminder` | shown | shown | never mounted | Correct — controlled by parent |
| `ExamComponent` Explanation | review only | review only | review only | Must become mid-exam for domain |
| `Summary` retake button | shown if mistakes | never shown | N/A | `canRetryAttempt` branch |