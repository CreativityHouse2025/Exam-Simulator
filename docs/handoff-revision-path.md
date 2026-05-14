# Handoff: Revision path implementation + timer fix

## What was done and why

### Problem
`startRevision` in `SessionProvider` called `adaptAttemptToSession(snapshot, { revision: true })` but the revision branch was commented out — clicking Revise produced a broken session. Additionally, the "what is a mistake" predicate was duplicated across three files and could drift out of sync.

### Changes made

#### 1. Centralized the mistake predicate — `src/utils/results.ts`
Added `isQuestionMistake(userAnswer, correctAnswer)`. Wraps the existing `isAnswerCorrect`. Treats unanswered and wrong the same (both need revising). This is the single source of truth for the revision filter.

Also removed the inline `arraysEqual` duplicate from `src/hooks/useResults.ts` — it now calls `isAnswerCorrect` directly.

#### 2. Extracted `getCorrectOriginalIndices` — `src/utils/format.ts`
The rule "correct answer = original indices where `choice.correct === true`" was open-coded inside `applyQuestionChoiceOrders` and referenced implicitly in the old commented revision draft. Extracted to a named export. `applyQuestionChoiceOrders` now delegates to it internally. Used by `adaptAttemptToRevision` to look up correct answers from the raw exam.

#### 3. Split the attempt adapter — `src/utils/attemptAdapter.ts`
Replaced the single overloaded `adaptAttemptToSession(payload, options?)` with two functions:
- **`adaptAttemptToSession(payload)`** — resume only. Now populates `session.questionIds` from `payload.questions` order so `ExamContextProvider` renders questions in attempt order, not file order.
- **`adaptAttemptToRevision(payload, rawExam)`** — revision. Filters `payload.questions` via `isQuestionMistake` against `getCorrectOriginalIndices` on the raw exam. Returns null on: non-full attempt, no questions, zero mistakes. Produces an ephemeral session (`id: ''`, `examType: 'revision'`, fresh empty answers, filtered `questionChoiceOrders`).

Both share a private `deriveSharedAttemptFields(payload)` helper to keep the common derivations (choice orders map, bookmarks, maxTime fallback) in lockstep.

#### 4. Added `Session.questionIds` — `src/types.ts` + `src/constants.ts`
New field: `questionIds: number[] | 'ALL'`. Makes the ExamContextProvider contract explicit:
- `'ALL'` — render the loaded file as-is (every new exam).
- `number[]` — render exactly these ids in this order (resume + revision).
Previously ExamContextProvider relied on the implicit invariant that the file's question order matched the attempt's order. This removes that assumption.

#### 5. Updated `ExamContextProvider` — `src/providers/ExamContextProvider.tsx`
After loading the exam file, if `session.questionIds !== 'ALL'`:
1. Builds `Record<id, Question>` from the full file.
2. Maps `questionIds` to get the subset in the stored order.
3. Surfaces an error toast if any id is missing (file/attempt mismatch).
Then calls `applyQuestionChoiceOrders` on the subset. The `questionChoiceOrders` from revision/resume sessions always align 1:1 with this subset, so no missing-key throws.

Added `session.questionIds` to the effect dependency array so a session swap (e.g. new exam after revision) triggers a fresh load.

#### 6. Wired `startRevision` — `src/providers/SessionProvider.tsx`
Flow: `getAttempt` → guard non-full → `loadFullExam` (raw exam for correct-answer lookup) → `adaptAttemptToRevision` → null = toast `attempts.errors.no-mistakes` → `setStartingSession`.

`startNewExam` sets `questionIds: 'ALL'`. `resumeAttempt` unchanged externally — the adapter now populates `questionIds` itself.

#### 7. Timer fix — `src/components/Navigation/Footer/Timer.tsx` + `src/utils/attemptAdapter.ts`
**Root cause:** `paused` was being used to encode two distinct states — "user paused mid-exam" and "exam is done." Both manual-submit (`Menu.tsx`) and timer-expiry (`Confirms.tsx`) dispatch `SET_TIMER_PAUSED: true` alongside `SET_EXAM_STATE: 'completed'`. When a completed attempt is reviewed from history, the adapter was resetting `paused: false`, breaking the implicit invariant.

**Fix:** The timer now explicitly checks `examState !== 'completed'` as part of its interval condition. `paused` means only what it says: the user deliberately paused mid-exam. The adapter keeps `paused: false` for all resumed sessions (the user is reviewing, not paused). This makes the business rule — "the timer only ticks during an active exam" — explicit in the component that owns the timer.

#### 8. Translation keys — `src/data/langs/en.json` + `ar.json`
Added `attempts.errors.no-mistakes` for the zero-mistakes defensive case in `startRevision`.

---

## Next steps: write tests

### Test framework
Jest + fast-check. Run with `npm test`. Existing example: `test/format.test.ts` — follow its patterns for helpers, unit cases, and property tests.

### Files to test

#### `src/utils/results.ts` — `isAnswerCorrect`, `isQuestionMistake`, `computeResults`
- `isAnswerCorrect`: order-independence (property), empty arrays, different lengths, single element, multi-correct.
- `isQuestionMistake`: null → true, empty array → true, wrong answer → true, correct → false. Property: `!isQuestionMistake(x, x)` for any non-empty x.
- `computeResults`: all correct, all wrong, all incomplete, mixed. Pass/fail threshold boundary. Property: `correctCount + incorrectCount + incompleteCount === exam.length`.

#### `src/utils/format.ts` — `getCorrectOriginalIndices`
- Single correct at index 0, single at last index, multiple correct, all correct, none correct (edge).
- Property: output indices are always a subset of `[0..choices.length-1]`. Property: every returned index has `choice.correct === true` at that position.
- Throws on unsupported question type.
- Consistency property: `getCorrectOriginalIndices(q)` equals the `answer` field produced by `applyQuestionChoiceOrders` under any permutation (since the two must agree).

#### `src/utils/attemptAdapter.ts` — `adaptAttemptToSession`, `adaptAttemptToRevision`

**`adaptAttemptToSession`:**
- Returns null on empty `payload.questions`.
- `questionIds` matches `payload.questions` order exactly.
- `paused` is `false` for in-progress attempts.
- `paused` is `false` for completed attempts (reviewing, not paused — timer stops via `examState` check in Timer).
- `questionChoiceOrders` keys match `questionIds`.
- `bookmarks` contains only bookmarked question indices.
- `maxTime` uses `examTypes` duration when available, falls back to `time_remaining`.

**`adaptAttemptToRevision`:**
- Returns null when `exam_type !== 'full'`.
- Returns null on empty `payload.questions`.
- Returns null when all questions are answered correctly (zero mistakes).
- Only wrong questions are included: property — every question in the output was either unanswered or answered incorrectly per `isQuestionMistake`.
- No correct questions leak through: property — no question answered correctly appears in the output.
- `questionIds` and `questionChoiceOrders` keys are in sync (same set, same order).
- `selectedOriginalIndices` is all empty arrays of length matching `questionIds`.
- `examType` is `'revision'`, `id` is `''`, `examState` is `'in-progress'`, `bookmarks` is `[]`.
- `examId` preserved from the original attempt.
- Mixed attempt (some right, some wrong, some unanswered): only wrong + unanswered appear.
- Property (fast-check): for any randomly generated attempt where at least one question is a mistake, the output is non-null and its `questionIds.length` equals the count of mistakes.

### Test file location
Follow the existing pattern: `test/attemptAdapter.test.ts`, `test/results.test.ts`. Import from `../src/utils/...` with `.js` extensions (Node ESM requirement — see `tsconfig.api.json`).

### Shared test helpers to write once and reuse
```ts
makeAttemptQuestion(overrides?)   // builds AttemptQuestion with sensible defaults
makeAttemptDetail(overrides?)     // builds AttemptDetail
makeGetAttemptResult(questions, detail?)  // assembles GetAttemptResult
makeRawQuestion(choices)          // builds a raw Question (pre-applyQuestionChoiceOrders)
makeRawExam(questions)            // Exam[]
```

These mirror the `makeQuestion` / `arbQuestion` helpers in `test/format.test.ts`.
