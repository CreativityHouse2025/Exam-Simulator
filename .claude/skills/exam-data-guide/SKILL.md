---
name: exam-data-guide
description: "How the Exam Simulator's question banks are laid out and safely edited — the per-exam/per-category/per-language JSON files under src/data/exam/, the question and choice shape, the invariants that hold across the Arabic and English copies, and the two bundled scripts that locate a question and validate the banks. Use this skill whenever fixing or changing a question, answer, explanation, or choice, adding or removing a full exam or domain category, editing full-exams.json or categories.json, updating a translation, or touching anything under src/data/. Also use when an exam shows the wrong number of questions or a question grades incorrectly. Question ids are not unique across banks and a fix applied to one copy silently leaves the other wrong, so always locate every copy before editing."
---

# Exam Data Guide (question banks)

## Overview

The question banks are plain JSON checked into the repo — there is no CMS and no database copy.
That makes edits cheap but unguarded: nothing validates a hand-edit, and a wrong answer ships to
students. The two bundled scripts exist to close that gap. Use them; they take seconds.

## Layout

```
src/data/exam/
├── full-exams.json        # full exam list: id, name {en, ar}, questionCount
├── categories.json        # domain list:    id, name {en, ar}, questionCount
├── exam-types.json
├── full/{en,ar}/<examId>.json      # one file per full exam, per language
└── domain/{en,ar}/<categoryId>.json # one file per domain category, per language
```

Each bank file is a **flat array of questions**:

```json
{
  "type": "multiple-choice",
  "text": "A project team received training on …",
  "explanation": "this option is the fastest …",
  "choices": [
    { "text": "Meet with the entire team and ask existing members to train the new members.", "correct": true },
    { "text": "Negotiate an increase in budget …", "correct": false }
  ],
  "id": 532
}
```

Questions may have **more than one correct choice** — scoring compares index *sets*
(`getCorrectOriginalIndices` / `isAnswerCorrect` in `src/utils/`), so multi-answer questions are
supported by design. Don't "fix" a question that has two `correct: true` choices.

## Invariants

These hold today and the app depends on them:

1. Every `full/en/<id>.json` has a matching `full/ar/<id>.json` (same for `domain/`).
2. The two languages carry the **same question ids in the same order**. The order is what the
   session's stored question-id list and choice orders are resolved against.
3. `questionCount` in `full-exams.json` / `categories.json` matches the real array length. It drives
   the exam library UI; a stale count misleads students before they ever start.
4. en and ar agree on the number of choices, and on how many of them are correct.

**Not** an invariant — and the mistake most likely to be made here: the *index* of the correct
choice differs between `en` and `ar`. Translated files legitimately order choices differently
(question 989 is correct at index 3 in English and index 0 in Arabic, same answer text). Never
copy a choice index from one language file into the other. Match on **text meaning**, not position.

## Question ids are not unique across banks

724 question ids appear in both a full exam and a domain category. A question fixed in
`full/en/17.json` can still be wrong in `domain/en/25.json`. **Locate every copy first:**

```bash
python .claude/skills/exam-data-guide/scripts/find_question.py 2997
```

It prints every file, array index, and per-language correct-choice index for each id you pass.
Pass several ids at once when a batch of answers is being corrected.

## Editing workflow

1. **Locate** — `find_question.py <id>`; note every file and index it reports.
2. **Edit each copy** — English and Arabic, and both banks if the question is in both. Change the
   `correct` booleans by matching answer *text*, not the index the other language uses.
3. **Validate** — `python .claude/skills/exam-data-guide/scripts/validate_banks.py`. Exit code 1
   lists what broke.
4. **Commit** — imperative subject naming the ids, e.g. `fix: update question 2997 answer to 3rd`.
   A commit touching only one language file is almost always incomplete.

Adding or removing questions means updating `questionCount` in `full-exams.json` or
`categories.json` in the same commit — the validator catches a mismatch, but only if it is run.

## Known issues (pre-existing, not introduced here)

- `full/5.json` index 149, question id 1381: English has 6 choices, Arabic has 4.
- Choice order differing between languages means the per-attempt `choices_order` stored at start
  is only meaningful in the language the attempt began in. Worth keeping in mind when touching
  language switching mid-session.

## How the data is consumed

Exams are loaded on demand by `loadFullExam(examId, langCode)` / `loadDomainExam(categoryId, langCode)`
and passed through `applyQuestionChoiceOrders` before rendering. UI strings live separately in
`src/data/langs/{ar,en}.json`, imported dynamically per language. See `frontend-guide` for how
providers load and cache this.

## Related skills

- **Providers, loaders, session question-id resolution → invoke `frontend-guide`.**
- **Attempt rows, `questions` payloads, anything persisted about an answer → invoke
  `backend-guide`** and `database-guide`.
