# Spec: PMP 2026 content release

Status: ready once the content sheets exist. Resolved via `/grill-me` on 2026-10-13. Agile Methodology and the case-study swap decided 2026-10-14. Nothing is undecided.

Scope: the **PMP track only**. RMP content is untouched.

Builds on `spec-exam-tags.md`, whose migrations (021–023) archived every existing exam and left the catalog empty until new content arrives. This spec is that content.

## Problem Statement

After the tags change, the PMP catalog is empty: every exam is archived and the only active tag is `full`. Students have nothing to start.

The business has reorganised PMP content around the exam content outline (People, Process, Business Environment) and its tasks, and around case studies. It wants:

- a category for each domain, with one exam per task;
- dedicated categories for case studies, Agile and AI;
- the best of the old full exams back on the shelf, opening with case studies;
- new full exams.

Much of this content already exists as questions inside the old full exams. Copying it would mean a typo fixed in one place stays wrong in another. Reused questions must be shared, not copied.

## Solution

One content release, delivered as three migrations deployed together, adds six PMP category tags and their exams, reopens five full exams, adds three new full exams, and moves the PMP full-exam breaks.

**Categories** (in this order on the Categories page, after Full exams):

| Order | Category | Exams |
|---|---|---|
| 1 | People | 8, one per task |
| 2 | Process | 10, one per task |
| 3 | Business Environment | 8, one per task |
| 4 | Case Studies | 1 new exam, 45 questions (9 case studies × 5) |
| 5 | Agile Methodology | 2 exams: Agile 1 (new), then Agile 2 (the old Agile exam) |
| 6 | Artificial Intelligence | the existing AI Questions exam, moved here |

**Full exams** (newest first): the three new full exams, then PMP Aug 2026, PMP Core 2026, PMI Exam 3, PMP Full Exam ECO 1, PMP Full Exam ECO 2.

- PMP Core 2026, PMI Exam 3, ECO 1 and ECO 2 open with **two case studies** (10 questions) taken from the Case Studies exam, placed in front of their existing questions; questions are dropped from the end to keep each exam at 180. Each gets a different pair; no case study appears in two full exams.
- PMP Aug 2026 is reopened unchanged.
- The three new full exams carry their own case studies, written for them. They do not draw on the Case Studies exam.

**Breaks** in every PMP full exam move to after question 40 and after question 110.

**Sharing rule:** a question used in two exams is one question row with two exam links. Reused questions are never copied.

## User Stories

### Student: browsing

1. As a PMP student, I want the Categories page to list People, Process, Business Environment, Case Studies, Agile Methodology and Artificial Intelligence in that order, so that the catalog follows the exam content outline first.
2. As a PMP student, I want the People category to list one exam per People task, in task order, so that I can drill each task on its own.
3. As a PMP student, I want the Process category to list one exam per Process task, in task order, so that I can drill each task on its own.
4. As a PMP student, I want the Business Environment category to list one exam per Business Environment task, in task order, so that I can drill each task on its own.
5. As a PMP student, I want each task exam's name to say which task it covers, in Arabic and English, so that I know what I'm practising.
6. As a PMP student, I want a Case Studies category with one exam of 50 case-study questions, so that I can practise scenario reasoning on its own.
7. As a PMP student, I want an Artificial Intelligence category holding the AI Questions exam, so that I can find AI content without scrolling past domain exams.
8. As a PMP student, I want the Agile Methodology category to hold a new Agile 1 exam and the existing Agile exam, so that I can practise Agile with fresh questions and the established set.
9. As a PMP student, I want the Full exams page to show the newest exams first, so that I take the most current material before older sets.
10. As a PMP student, I want each category chip to have its own colour, so that I can tell categories apart at a glance.
11. As a PMP student, I want each exam card's question count and description to match what I will actually get, so that I'm not surprised when I start.

### Student: taking exams

12. As a PMP student taking a task exam, I want it untimed with the correct answer and explanation shown after each question, so that it works as a study drill like the old domain exams.
13. As a PMP student taking the Case Studies exam, I want it untimed with answers revealed, so that I can learn the case-study style before meeting it under time pressure.
14. As a PMP student taking a case study, I want the scenario shown on the first question and its follow-up questions right after it, in order, so that I can answer them against the scenario I just read.
15. As a PMP student taking PMP Core 2026, PMI Exam 3, ECO 1 or ECO 2, I want the exam to open with two case studies, so that it mirrors the real exam's format.
16. As a PMP student, I want each of those four full exams to open with different case studies, so that taking several full exams never repeats a scenario.
17. As a PMP student taking a new full exam, I want it to open with its own case studies, so that it also mirrors the real exam's format.
18. As a PMP student taking any PMP full exam, I want breaks offered after question 40 and after question 110, so that the breaks match the current exam format.
19. As a PMP student taking a full exam, I want it timed at 4 hours with a 75% pass mark, as before, so that it stays a realistic sitting.

### Student: history

20. As a PMP student, I want my past attempts on the reopened full exams to keep showing the questions I actually answered, so that my review stays accurate after the case studies are added.
21. As a PMP student with an unfinished attempt on a reopened full exam, I want to resume it with its original questions and breaks, so that the content change never corrupts work in progress.
22. As a PMP student, I want my past attempts on AI Questions to show its new category, so that my history matches the catalog.
23. As a PMP student, I want my attempts on exams that stay archived (old domain exams, old Case Studies, older full exams) to stay in my history and review, so that I keep my record.
24. As a PMP student, I want to be told an old exam is no longer available if I try to start it, so that I understand why it's gone.

### Supervisor

25. As a supervisor, I want to browse the new PMP categories and exams exactly as students see them, so that I can answer their questions.
26. As a supervisor, I want to inspect and preview any new exam's questions, so that I can audit the content before students complain.
27. As a supervisor, I want a fix to a shared question to show in every exam that uses it, so that I fix each mistake once.

### Business / content

28. As a content author, I want to supply new questions as Excel sheets, so that I keep working in the tool I already use.
29. As a content author, I want a task's reused questions given only as a list of existing question ids, so that I never retype or re-translate a question that already exists.
30. As a content author, I want a task's brand-new questions in their own sheet, separate from its reused ones, so that it is always clear which questions are new.
31. As a content author, I want the generator to refuse to run when any sheet is missing, so that a half-finished release never reaches students.
32. As a content author, I want the generator to fail loudly on a reused id that doesn't belong to one of the five kept full exams, so that a typo never links the wrong question.
33. As a content author, I want a warning when one reused question appears in two task exams, so that any overlap is deliberate.
34. As the business, I want reused questions shared rather than copied, so that a correction reaches every exam that uses them.
35. As the business, I want the release to go live in one step, so that students never see a half-filled catalog.
36. As the business, I want the content sheets kept out of the repository, so that unreleased question content stays private.
37. As a PMP student with past attempts on the old Agile exam, I want them to show under Agile Methodology, so that my history matches the catalog.

## Implementation Decisions

### Delivery

- **One migration per level, all deployed together** so the catalog never goes live half-filled. Each is wrapped in its own transaction, built and tested on the local database first, then staged.
  - **024, hand-written:** the break move.
  - **025, hand-written:** the six tags (archived `legacy` moves to order 7 to free order 1), the AI retag and reopen, and reopening the five kept full exams.
  - **026–031, one per level, in this order** (generated, except the hand-written 027):
    1. Case Studies exam: new questions + catalog (026).
    2. Kept full exams: case studies at the start (027).
    3. New full exams: new questions + catalog (028).
    4. Agile: Agile 1 (new) + the old Agile exam as Agile 2 (029).
    5. Task exams' catalog + their existing (reused) questions (030).
    6. Task exams' new questions, appended after the reused ones (031). It aborts unless each task exam is found and still holds exactly its reused-question count.
  - Full-exam display order is set in level 3, when the new full exams exist.
- Generated migrations come from one standalone Python script (`openpyxl`), with one entry per level. It reuses the SQL and description helpers of the original content generator; that generator still owns 011/012/017.
- The generated SQL is committed. **The sheets are not**: they stay local, in the gitignored exam data folder (`sheets/`).
- A generated migration can be regenerated freely while it has only run locally. After deployment it is frozen, and any later change is a new migration.
- The script refuses to generate if its level's input is missing.
- **Sheet layout:** an `EN` and an `AR` tab with the columns `text | option_a..option_e | correct_choice | explanation`, read by header name. Extra tabs and columns are ignored. `correct_choice` holds letters (`B`, `A,C`). Existing-question files hold `question_id | task_code`.

### Question identity

- New questions get **database-assigned ids** from the existing identity column. The migration inserts them without ids, captures the assigned ids, and links them to their exams through its own source-to-id mapping. Excel numbering never becomes a database id.
- New exams likewise get database-assigned ids and are referenced inside the migration through its mapping, never by literal id. *(Extension of the question rule; not discussed explicitly.)*
- **Sharing rule:** a question in two exams = one `questions` row + two `exam_questions` rows. That applies to:
  - case-study questions shared between the Case Studies exam and a reopened full exam;
  - reused questions linked into task exams.

### Tags

Six new tags, all on the PMP track, none archived:

| display_order | code | name_en | name_ar | color_hex_code |
|---|---|---|---|---|
| 1 | `people` | People | الأفراد | `#2f6f9a` |
| 2 | `process` | Process | العمليات | `#2f8a5b` |
| 3 | `environment` | Business Environment | بيئة الأعمال | `#b5562d` |
| 4 | `casestudies` | Case Studies | دراسات الحالة | `#5a5f9e` |
| 5 | `agile` | Agile Methodology | المنهجية المرنة (أجايل) | `#a0832b` |
| 6 | `ai` | Artificial Intelligence | الذكاء الاصطناعي | `#3a8a8a` |

`full` (order 0) and `legacy` (archived) are unchanged.

### Configs and breaks

- Full exams use the existing **PMP Full** config (240 min, 75%, no reveal, retry-wrong allowed).
- Task exams and the Case Studies exam use the existing **PMP Domain** config (untimed, 85%, reveal answers, no retry-wrong). AI Questions keeps it.
- No new config.
- PMP Full breaks move from indexes 60 and 120 to **40 and 110** (after Q40 and Q110; 10 minutes each, unchanged). This affects archived exams on that config too, which is harmless. Attempts read `config_snapshot`, so history and in-progress attempts keep their original breaks.
- The break trigger rejects a break index ≥ an exam's question count, so every full exam needs **more than 110 questions**. The generator asserts this.

### Existing exams

- **Reopened** (archive date cleared), still tagged `full`: PMP Aug 2026, PMP Core 2026, PMI Exam 3, PMP Full Exam ECO 1, PMP Full Exam ECO 2.
- **AI Questions** is retagged to `ai` and reopened.
- **The old Agile exam** (200 questions, PMP Domain config) is retagged to `agile` at display order 2 and reopened, keeping its name, questions and config.
- **Everything else stays archived**, including the old Case Studies exam (its questions are not reused).
- **Full-exam display order** (per track and tag): new full exams 1–3, then PMP Aug 2026, PMP Core 2026, PMI Exam 3, ECO 1, ECO 2 (4–8). The unique (track, tag, display_order) constraint also covers archived full exams, which currently hold orders 1–16. The migration renumbers archived full exams after the active ones; the constraint is deferred, so this works within the transaction.

### Case studies

- Case Studies exam: **45 new questions = 9 case studies × 5** (a 10th was dropped: its scenario was an image). The first question of each case study carries the scenario plus its question; the next four carry only their question.
- The four reopened full exams (PMP Core 2026, PMI Exam 3, ECO 1, ECO 2) receive two case studies at indexes 0–9, and their existing questions move down by 10. If that takes an exam past 180, questions are **dropped from the end** until it is 180 (Core 2026 loses 15, PMI Exam 3 and ECO 1 lose 10, ECO 2 loses 5). All four end at 180 questions, and count and description are updated. Dropped questions stay in `questions`, because attempts and other exams may reference them.
- **Wiring is by position in the Case Studies exam**, not by literal question id, so it can't drift from the ids production assigns: Core 2026 takes positions 0–9 (case studies 1–2), PMI Exam 3 10–19 (3–4), ECO 1 20–29 (5–6), ECO 2 30–39 (7–8). Case study 9 stays only in the Case Studies exam. Hand-written in 027.
- **PMP Aug 2026 gets no case studies.**
- Editing `exam_questions` of a reopened exam is safe for history: attempts hold `question_ids_snapshot`, and save, submit, review and revision all read it.

### Task exams

- 26 exams (People 8, Process 10, Business Environment 8), PMP Domain config, `display_order` = task number within its tag. Named "Task N: <task>" / "المهمة N: <task in Arabic>" (e.g. "Task 1: Develop a common vision" / "المهمة 1: تطوير رؤية مشتركة"); the 26 names live in the generator's task table. Created in 030 holding their reused questions; level 6 appends the new ones.
- A task exam has up to two sources:
  - **reused questions**: an explicit **list** of existing question ids (not ranges);
  - **new questions**: full question rows, inserted and linked.
  
  Either may be absent, but not both.
- **Order inside a task exam:** reused questions first, then new ones, each in source order.
- Reused ids are validated against the **original** membership (as 012 inserted it, before the case-study swap) of seven exams: the five kept full exams plus the archived **PMI Exam 1 and PMI Exam 2** (357 of the 1,077 reused ids come from those two; accepted 2026-10-14). An id outside them aborts generation. The 40 questions 027 trimmed from the kept exams all live on in task exams.
- One reused question in two task exams is allowed and reported as a warning.

### New full exams

- Three exams, PMP Full config, tag `full`, display order 1–3: **PMP Core October 2026 (1)**, **(2)**, **(3)** / **اختبار PMP Core أكتوبر 2026 (1)**, **(2)**, **(3)**, from sheets `exam_1/2/3_pmp` (180, 176, 180 questions). Generated in 028, which also moves the kept full exams to 4–8 and archived PMP full exams past 100.
- Each sheet is **self-contained**: it includes the exam's own case studies in its first 10 rows. The generator adds nothing.
- All questions are new rows.

### Questions with images

- Images are not supported. **The authors remove image questions before handing sheets over.** Received sheets contain no images, and the generator does not look for them.
- When a drop breaks a case study (for example, its scenario question had an image), the authors repair it in the sheet.
- Every question count in this spec is therefore an upper bound. Real counts come from what is linked: `question_count`, descriptions and guards all use the actual number.

### Generated fields

- `question_count` is counted from the linked questions.
- Descriptions use the same templates as the original catalogue:
  - full: "N questions across the three PMP domains, timed at 4 hours with two scheduled breaks.";
  - domain-config: "N untimed practice questions, with the correct answer and explanation shown after each one.";
  - plus their Arabic counterparts.
- Question type stays `multiple-choice`. More than one correct choice is allowed; `answer_count` is derived from the correct choices.
- Each choice row holds both languages, so choice *N* must mean the same answer in Arabic and English. The generator must guarantee this; how depends on the deferred sheet layout.

### Agile Methodology

Two exams under `agile`:

| display_order | Exam | Source |
|---|---|---|
| 1 | Agile 1 / أجايل 1 | New exam, 170 questions from `agile_new.xlsx`; PMP Domain config |
| 2 | Agile 2 / أجايل 2 | The old Agile exam (200 questions), renamed, retagged and reopened |

Both are done in 029 (generated, level 4).


## Testing Decisions

- **Primary seam: the migration itself**, replayed by `npm run db:reset` against the local Supabase stack. The generated migration ends with `DO $$ … RAISE EXCEPTION` guards, the same pattern as the attempts migration's pre-flight checks. A failed guard aborts the transaction, so a bad release can't apply. The guards check:
  - Tag count, codes, order and track for the six new tags.
  - Exact exam count per tag (people 8, process 10, environment 8, casestudies 1, agile 2, ai 1, full 8 active); no active exam on `legacy`.
  - Every active exam's `question_count` equals its linked question count, and its `exam_questions` indexes run 0..n−1 without gaps.
  - The four case-study full exams: indexes 0–9 are Case Studies exam questions; indexes 10 onwards are the original questions in order, dropped only from the end; no case-study question appears in two full exams.
  - PMP Full breaks are exactly {40, 110}; every active full exam has more than 110 questions.
  - Every new question has at least one correct choice, and `answer_count` matches its correct choices.
- **Generator-time checks** (before any SQL is written): missing inputs, reused ids outside the kept exams' original membership, en/ar disagreement, duplicate-task warnings. These follow the existing content generator, which asserts expected counts and refuses to run on en/ar disagreement.
- **API smoke** after reset (`vercel dev`, enrolled student and supervisor):

  | Request | Expect |
  |---|---|
  | `GET /tracks/:pmp/tags` | `full` then people, process, environment, casestudies, agile, ai; no `legacy` |
  | `?tag=people` / `process` / `environment` | 8 / 10 / 8 exams, in task order |
  | `?tag=casestudies` | 1 exam, 45 questions |
  | `?tag=ai` | AI Questions only |
  | `?tag=agile` | Agile 1, then Agile 2 (200 questions) |
  | `?tag=full` | 8 exams, newest first |
  | Start a reopened full exam | First 10 questions are its two case studies; breaks offered at Q41 and Q111 |
  | Review a pre-release attempt on a reopened full exam | Original questions, unchanged |
  | Start an exam that stays archived | 410 `EXAM_ARCHIVED` |

- **Manual walk-through** of the Categories, exam list and exam pages on mobile and desktop, in both languages: names, chip colours, counts.
- No test framework is added.

## Out of Scope

- **RMP** content and tags.
- Linking a case study's scenario to its follow-up questions (a passage entity shown above each question). Follow-ups shown alone (retry-wrong session, revision subset, supervisor question viewer) appear without their scenario. **Accepted for now; candidate follow-up spec.**
- Any schema, API or UI change. This release is content only, plus the break move.
- Reusing the old Case Studies exam's questions.
- Admin UI for content.
- Enforcing that a tag's track matches its exams' track (already an accepted risk).

## Further Notes

- **Demo seed:** it reopens and re-archives exams 18, 44 and 45 only, so it doesn't collide with the reopened exams.
- Exam names and placement live in the generator's level entries (committed; no question text). Sheets stay local.
- After release, update the exam-data guide: its layout section still describes the JSON banks, which no longer reflect the content in the database.
