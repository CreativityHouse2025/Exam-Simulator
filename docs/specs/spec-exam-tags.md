# Spec: Exam tags, archiving and per-exam attempt limits

Status: ready for implementation. Resolved via `/grill-me` on 2026-10-09/10.

## Problem Statement

Students see one long, flat list of every exam in a track, filtered by two hardcoded "types" (Full / Domain). The business now organises content by PMI domain (People, Process, Business Environment, and domains with no tasks), and wants students to browse that way: pick a track, pick full exams or a domain, then pick an exam.

The business also needs to retire old content without erasing student history, and the current attempt rules no longer match what the business wants:

- History is capped at 150 attempts per track, so one heavily retried exam can push every other exam's history out.
- A student can open any number of unfinished attempts on the same exam at once.
- Old exams cannot be taken off the shelf. Removing them would orphan the attempts that reference them.

## Solution

Every exam stays a single row with a single **tag**. The tag says where the exam is listed:

- The shared `full` tag puts it under **Full exams**.
- A track-specific domain tag (`people`, `process`, `environment`, …) puts it under **Domains**. A task is an exam tagged with its domain. A domain without tasks is a tag with one exam.

The question layer (questions, choices, exam questions, configs, breaks) is untouched.

Students navigate **Track → Full exams | Domains → (domain) → exam**. Every page fetches its own data, so any URL works when opened cold.

Exams can be **archived**. An archived exam disappears from every place a student could start it. It stays in the student's history and review, and an unfinished attempt on it can still be resumed and submitted. Supervisors keep seeing archived exams, clearly labelled. Every exam that exists today is archived by this change; new content arrives in later migrations.

Attempts follow three rules:

1. A student can have at most one unfinished attempt per exam. Starting again resumes it.
2. The track defines how many attempts per exam are kept (default 10). Older ones are deleted automatically.
3. A completed attempt's grade lives in its own results record.

## User Stories

### Browsing (student)

1. As a student, I want to open a track and see two clear choices, Full exams and Domains, so that I can decide how to practise without scrolling a long list.
2. As a student, I want the Full exams page to list only full exams in the track's order, so that I take them in the intended sequence.
3. As a student, I want the Domains page to list the track's domains in PMI order (not alphabetical), so that the structure matches what I study.
4. As a student, I want domains with nothing I can take hidden from the Domains page, so that I never open an empty domain.
5. As a student, I want to open a domain and see its exams in order, so that I can work through its tasks.
6. As a student, I want each exam card to show its name, description, question count and duration, so that I know what I'm starting.
7. As a student, I want to bookmark or refresh any catalog page and land on the same content, so that the browser's back, refresh and share all work.
8. As a student, I want domain and exam names in Arabic or English to follow my language setting, so that the catalog reads naturally.
9. As a student on a phone, I want the catalog cards to stack and stay tappable, so that I can practise on mobile.
10. As a student, I want a clear message when a domain link is wrong or no longer exists, so that I'm not left on a blank page.

### Archived exams (student)

11. As a student, I want archived exams removed from every list I can start from, so that I only see exams the business currently offers.
12. As a student, I want my past attempts on archived exams to stay in my history with their exam names, so that I keep my progress record.
13. As a student, I want to review a completed attempt on an archived exam, so that I can still learn from my mistakes.
14. As a student, I want to resume and submit an unfinished attempt on an exam that was archived after I started, so that I don't lose work in progress.
15. As a student, I want a clear "no longer available" message if I try to start an archived exam, so that I understand why nothing happened.

### Attempts (student)

16. As a student, when I press Start on an exam where I already have an unfinished attempt, I want to be offered to resume it, so that I don't lose answers or start a duplicate by mistake.
17. As a student, I want two tabs pressing Start at the same moment to result in a single attempt, so that I never end up with duplicates.
18. As a student, I want unlimited retries on an exam after finishing my previous attempt, so that I can practise as much as I like.
19. As a student, I want my most recent attempts per exam kept (up to the track's limit), so that heavy practice on one exam never erases my history on another.
20. As a student, I want my completed attempts to show score, pass/fail, wrong-question count and time taken, so that I can track improvement.
21. As a student, I want the time taken to show as not applicable on untimed exams, so that I'm not shown a meaningless number.

### Supervisor

22. As a supervisor, I want to browse a track the same way students do (Full exams / Domains / exams), so that I see what they see.
23. As a supervisor, I want archived exams included and clearly labelled "Archived", so that I can inspect legacy content when supporting a student.
24. As a supervisor, I want domains that contain only archived exams to still appear for me, so that legacy content remains reachable.
25. As a supervisor, I want the question viewer and preview sessions to keep working for active and archived exams, so that I can audit any exam.
26. As a supervisor, I want a student's attempt history to show exam names even for archived exams, so that support conversations make sense.

### Business / content

27. As the business, I want to set the number of attempts kept per exam on each track, so that storage and history match the product offer.
28. As the business, I want lowering that number to trim every student's history immediately, so that the rule is always true and never "eventually" true.
29. As the business, I want to retire an exam by archiving it, never by deleting it, so that student history is preserved.
30. As the business, I want to reopen an archived exam by clearing its archive date, so that retirement is reversible.
31. As the business, I want to know when an exam was archived, so that support and future admin tools can explain changes.
32. As the business, I want tag order and exam order inside each tag to be explicit, so that the catalog order is a content decision, not an accident of insertion.
33. As a content author, I want to reorder exams within a tag in one migration transaction without fighting uniqueness errors, so that reordering is cheap.
34. As a content author, I want an unknown tag code to fail loudly, so that typos in links or content don't silently show empty sections.

## Implementation Decisions

### Delivery: vertical slices

Each slice is finished end to end (database → API → frontend) and verified on its own before the next one starts. Do **not** build all migrations first, then all endpoints, then all UI. Each slice leaves `npm run verify` green and the app working.

| # | Slice | Depends on |
|---|---|---|
| 1 | Results record | — |
| 2 | Tags and catalog navigation | — |
| 3 | Tag-filtered exam lists | 2 |
| 4 | Archiving | 3 |
| 5 | One open attempt per exam | — |
| 6 | Per-exam attempt limit | — |

Order: 1 → 2 → 3 → 4 → 5 → 6. Slices 1, 5 and 6 can move earlier if needed.

Migrations: the existing uncommitted 019 (track code) stays as is. The existing uncommitted 020 (results) is edited in place, on the assumption that it has only ever run locally. Catalog changes go into a migration named for exam tags (021). Attempt-rule changes go into a migration named for attempt limits (022). Each migration is wrapped in a single transaction. When slices interleave across two migration files, the file content grows slice by slice, and `npm run db:reset` replays it every time.

### Slice 1: Results record

- The results table records one row per completed attempt: attempt id (primary key, foreign key to the attempt with cascade delete), status (`pass` | `fail`), score (0–100, two decimals), wrong question count (not null, ≥ 0), **time taken in seconds** (null means the exam is untimed), and a completion timestamp.
- **The attempt's `exam_state` is the source of truth for completion.** The results row is the payload. `submit_attempt` flips `exam_state` to completed and inserts the results row in the same transaction.
- Backfill: every completed attempt gets a results row. Wrong question count is **recomputed** with the existing correct-question-ids function (total questions minus correct), because older attempts may have a null value. Time taken is duration × 60 minus time remaining, which is null for untimed exams.
- Status, score and wrong question count are dropped from the attempt row. Every RPC and service that read them reads from results.
- API contract: attempt responses keep exposing score, status, wrong-question count and time taken, now sourced from results. Time taken is new on the wire and nullable.

### Slice 2: Tags and catalog navigation

- The exam type table is **renamed to tags**, and the exam column referencing it is renamed from type id to **tag id** (not null).
- New tag columns:
  - `code`: text, not null, **globally unique** (e.g. `full`, `people`, `process`, `environment`). The API and URLs address a tag by code.
  - `track_id`: nullable. Null means a shared tag. Only `full` is shared.
  - `display_order`: smallint, unique per track, deferrable initially deferred. It orders the domain sections; `full` has order 0.
- Backfill: existing row 1 becomes `full` (shared). Existing row 2 becomes `legacy-domain` (PMP track) and is never linked from the UI. New domain tags arrive with new content.
- No trigger ties an exam's tag to the exam's track (accepted risk).
- **New endpoint** `GET /api/tracks/:trackId/tags`, with the same auth and enrollment gate as the track's exam list. It returns `{ tags: Tag[] }`: only tags that have at least one exam **visible to the caller** on that track, sorted by `display_order`. The frontend separates `full` from domain tags.
- Wire shape (`Tag` replaces `ExamType`):

  ```ts
  Tag = { id: number; code: string; name: { ar: string; en: string }; colour: string | null; display_order: number }
  ```

- `FULL_TAG_CODE = "full"` is a single constant in the shared schema package, used by both the API and the frontend.
- Frontend pages (all inside the existing feature/page layout; pages assemble only):
  - **Track page**: two cards, Full exams and Domains, plus the existing recent-attempts section. The cards are static. The track name comes from the existing tracks data.
  - **Domains page**: calls the tags endpoint, drops `full`, and renders one card per domain tag.
- Visual direction: modern, card-based, mobile-first. Use shadcn/ui primitives and Tailwind v4 with existing design tokens only; no new styling system, no plain CSS unless the styling guide allows it. Use lucide icons. Show skeletons while loading, plus the existing empty and error state components.

### Slice 3: Tag-filtered exam lists

- `GET /api/tracks/:trackId/exams?tag=<code>`:
  - `tag` is **required**. Missing returns 400 (validation error code).
  - Unknown code returns **404 `TAG_NOT_FOUND`**.
  - Known code with no caller-visible exams on this track returns **200 with an empty list**.
  - Response is `{ exams: ExamDetails[] }`. The old `types` array is **removed**; tags come only from the tags endpoint.
  - Sorted by exam `display_order`.
- Exam wire shape: `type_id` becomes `tag_id`.
- Exam `display_order` becomes **per (track, tag)**: unique on (track id, tag id, display order), deferrable initially deferred. The identity default is dropped, and new content sets explicit values. Backfill renumbers with a row number partitioned by (track, tag), keeping today's relative order.
- **Attempt history must not depend on the exam list.** The track page used to resolve exam names from the full exam list, which no longer exists. Attempt summaries now carry the exam's bilingual name (joined server-side, archived or not) so history renders on its own.
- Frontend pages:
  - **Exam list page**, parameterised by tag code: one page serves Full exams (`full`) and each domain. It calls the exams endpoint with the tag and the tags endpoint for the heading. A 404 shows the not-found state.
  - Existing exam cards are reused.
- The old type filter chips and the flat browser for the student flow are removed. The supervisor library moves to the same Track → Full exams / Domains → exam flow, keeping its inspect and preview actions in place of Start.

### Slice 4: Archiving

- Exams get `archived_at` (timestamptz, nullable). Null means active. Clearing it reopens the exam.
- The migration sets `archived_at = now()` on **every existing exam** (all full and legacy domain exams).
- **One visibility rule, written once** and shared by the tags and exams endpoints: students never receive archived exams, or tags whose exams are all archived; supervisors receive everything.
- Exam wire shape gains `archived_at: string | null`. Supervisors see an "Archived" badge (shadcn Badge, existing tokens).
- `start_attempt` returns a new result **`archived`** when the exam is archived. It maps to a dedicated error code the frontend parses and shows as "no longer available".
- Archiving blocks **only** starting. Save, submit, review and the supervisor question viewer and preview keep working on archived exams.
- Deep links: a student opening an archived exam's start path gets the not-available state; history and review links keep working.
- **Release note:** after this slice, students see an empty catalog until new content is migrated in.

### Slice 5: One open attempt per exam

- A partial unique index on attempts covers (user id, exam id) where `exam_state` is in progress **and `created_at` is on or after a fixed release cutoff** (literal timestamp with explicit UTC offset). Legacy rows before the cutoff are outside the index, so existing duplicate open attempts don't block the migration. They can only be finished, never multiplied. The cutoff gets a one-line comment.
- `start_attempt` first checks for an open attempt on that exam (old or new). If one exists, it returns a new result **`in_progress`** with the existing attempt's id and creates nothing. The index is the race backstop.
- Frontend: Start receiving `in_progress` shows a dialog (shadcn Dialog) offering **Resume**, which opens the existing attempt.

### Slice 6: Per-exam attempt limit

- Tracks get `attempts_per_exam` (smallint, not null, default 10, > 0).
- The eviction trigger is rewritten: after an attempt is inserted, it keeps the newest N attempts per (user, exam), where N comes from the exam's track, and deletes older ones. The just-inserted row is never evicted. Because of slice 5, eviction only ever removes completed attempts.
- **Eager trim:** updating a track's `attempts_per_exam` immediately deletes everything beyond the new limit for every student on that track.
- **Pre-flight check** before the change: if any (user, exam) already exceeds 10, the migration raises and lists the offenders instead of deleting silently.
- The previous 150-per-track cap is removed from the database and from the attempt service, including its use as the history list limit.

### Unchanged

Questions (including answer count), choices, exam questions (question order), exam config, breaks and both break-index triggers, allowed config, attempt answers, offered breaks, enrollments, auth and roles. Content tables keep the existing privilege pattern (no app-level delete); exams are never deleted, only archived.

## Testing Decisions

- **Seam: the HTTP API**, running `vercel dev` against the local Supabase stack after `npm run db:reset`. Plus a manual black-box walkthrough of each slice's pages by the developer, on mobile and desktop widths, in both languages. No test framework is added by this spec.
- A good check exercises observable behaviour only: status code, error code, response shape and ordering, rows that appear or disappear in history. Never internal function calls.
- `npm run verify` passes at the end of every slice.

API smoke checks per slice (student = enrolled student cookie, sup = enrolled supervisor cookie):

| Slice | Request | Expect |
|---|---|---|
| 1 | Complete an attempt, then list attempts | Score, status, wrong count, time taken present; time taken null on untimed |
| 1 | Review a pre-migration completed attempt | Wrong count present (recomputed) |
| 2 | `GET /tracks/:id/tags` (student, sup) | Sorted by display order; `full` first when present |
| 2 | `GET /tracks/:id/tags` (not enrolled) | Same refusal as the exam list today |
| 3 | `GET /tracks/:id/exams` (no tag) | 400 |
| 3 | `GET /tracks/:id/exams?tag=nope` | 404 `TAG_NOT_FOUND` |
| 3 | `?tag=<valid, nothing visible>` | 200, empty list |
| 3 | `?tag=full` | Exams ordered by per-tag display order; no `types` key |
| 3 | List attempts | Each summary carries the exam name |
| 4 | Student `?tag=full` / `?tag=legacy-domain` after migration | 200, empty |
| 4 | Sup same calls | All legacy exams, `archived_at` set |
| 4 | Student `/tags` | No archived-only tags; sup sees them |
| 4 | Start an archived exam | `archived` error code |
| 4 | Save / submit / review an attempt on an archived exam | Works |
| 5 | Start twice on the same exam | Second returns `in_progress` + same id; one row |
| 5 | Two parallel starts | Exactly one attempt created |
| 6 | Complete 11 attempts on one exam | 10 remain; oldest gone; other exams untouched |
| 6 | Lower the track's limit to 3 (SQL) | Every student trimmed to 3 per exam immediately |
| 6 | Migration on data with >10 per exam | Migration aborts, listing offenders |

Prior art: no automated tests exist in the repo. Checks follow the `DO $$ … RAISE EXCEPTION` guard pattern already used in the attempts migration for pre-flight data validation.

## Out of Scope

- Domain or task tables, hierarchy, hidden tasks, question sets (considered and rejected in favour of tags).
- Any admin UI for creating tags, ordering, archiving or editing limits (content changes stay in migrations).
- A reorder API or UI.
- Enforcing that a question belongs to at most one domain exam (true today, not enforced).
- A trigger tying an exam's tag to its track.
- New question types (the question shape stays type-agnostic; nothing new is built).
- New exam content (PMP/RMP domains and tasks arrive in separate migrations).
- Automated test infrastructure.
- Changes to the client-side retry-wrong session, breaks, timer or session persistence.

## Further Notes

- **Terminology:** UI and code use "full" (not "mock") for full exams. "Domain" is a UI term only; in data it's any tag other than `full`.
- **Assumptions to verify before running:** (1) 020 has never run outside local Docker; if it has, convert the 020 edits into a patch migration. (2) No student has more than 10 attempts on one exam; the slice 6 pre-flight confirms it.
- **Decisions added during spec writing** (confirm during review): attempt summaries carry the exam name (slice 3), because history can no longer borrow names from an untagged exam list; and the supervisor library adopts the same tag-based navigation (slice 3).
- After implementation, update the database, backend and frontend guides in `.claude/skills/` to describe tags, archiving and the attempt rules.
