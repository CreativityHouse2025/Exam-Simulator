# Spec: Exam tags, archiving and per-exam attempt limits

Status: ready for implementation. Resolved via `/grill-me` on 2026-10-09/10.

## Problem Statement

Students see one long, flat list of every exam in a track, filtered by two hardcoded "types" (Full / Domain). The business now organises content into categories and wants students to browse that way: pick a track, pick full exams or a category, then pick an exam.

The business also needs to retire old content without erasing student history, and the current attempt rules no longer match what the business wants:

- History is capped at 150 attempts per track, so one heavily retried exam can push every other exam's history out.
- A student can open any number of unfinished attempts on the same exam at once.
- Old exams cannot be taken off the shelf. Removing them would orphan the attempts that reference them.

## Solution

Every exam stays a single row with a single **tag**. The tag says where the exam is listed:

- The shared `full` tag puts it under **Full exams**.
- A track-specific category tag (`people`, `process`, `environment`, …) puts it under **Categories**. A category lists one or more exams.

The question layer (questions, choices, exam questions, configs, breaks) is untouched.

Students navigate **Track → Full exams | Categories → (category) → exam**. Every page fetches its own data, so any URL works when opened cold.

Exams and tags can be **archived**. An archived exam disappears from the catalog and can no longer be started. It stays in the student's history and review, and an unfinished attempt on it can still be resumed and submitted. An archived tag disappears from the catalog; it does not block starting its exams. Archived content is hidden from every role, supervisors included. Every exam that exists today, and the `legacy` tag, are archived by this change; new content arrives in later migrations.

Attempts follow three rules:

1. A student can have at most one unfinished attempt per exam. Starting again resumes it.
2. The track defines how many attempts per exam are kept (default 10). Older ones are deleted automatically.
3. A completed attempt's grade lives in its own results record.

## User Stories

### Browsing (student)

1. As a student, I want to open a track and see two clear choices, Full exams and Categories, so that I can decide how to practise without scrolling a long list.
2. As a student, I want the Full exams page to list only full exams in the track's order, so that I take them in the intended sequence.
3. As a student, I want the Categories page to list the track's categories in the track's intended order (not alphabetical), so that the structure matches what I study.
4. As a student, I want retired (archived) categories hidden from the Categories page, so that I only see categories the business currently offers. A category with no exams yet is still listed and shows the empty state.
5. As a student, I want to open a category and see its exams in order, so that I can work through them.
6. As a student, I want each exam card to show its name, description, question count and duration, so that I know what I'm starting.
7. As a student, I want to bookmark or refresh any catalog page and land on the same content, so that the browser's back, refresh and share all work.
8. As a student, I want category and exam names in Arabic or English to follow my language setting, so that the catalog reads naturally.
9. As a student on a phone, I want the catalog cards to stack and stay tappable, so that I can practise on mobile.
10. As a student, I want a clear message when a category link is wrong or no longer exists, so that I'm not left on a blank page.

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

22. As a supervisor, I want to browse a track the same way students do (Full exams / Categories / exams), so that I see what they see.
23. ~~Archived exams labelled for supervisors~~ — dropped: the business confirmed supervisors do not need archived content in the catalog.
24. ~~Archived-only categories visible to supervisors~~ — dropped, same reason.
25. As a supervisor, I want the question viewer and preview sessions to keep working for active and archived exams, so that I can audit any exam I can reach.
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
| 2 | Tags (data, API, exam and attempt shapes) | — |
| 3 | Tag-filtered exam lists and catalog navigation | 2 |
| 4 | Archiving | 3 |
| 5 | One open attempt per exam | — |
| 6 | Per-exam attempt limit | — |

Order: 1 → 2 → 3 → 4 → 5 → 6. Slices 1, 5 and 6 can move earlier if needed.

Migrations: the existing uncommitted 019 (track code) stays as is. The existing uncommitted 020 (results) is edited in place, on the assumption that it has only ever run locally. Catalog changes go into a migration named for exam tags (021). Archiving goes into its own migration (022). Attempt-rule changes go into a migration named for attempt limits (023). Each migration is wrapped in a single transaction. When slices interleave across two migration files, the file content grows slice by slice, and `npm run db:reset` replays it every time.

### Slice 1: Results record

- The results table records one row per completed attempt: attempt id (primary key, foreign key to the attempt with cascade delete), status (`pass` | `fail`), score (0–100, two decimals), wrong question count (not null, ≥ 0), **time taken in seconds** (null means the exam is untimed), and a completion timestamp.
- **The attempt's `exam_state` is the source of truth for completion.** The results row is the payload. `submit_attempt` flips `exam_state` to completed and inserts the results row in the same transaction.
- Backfill: every completed attempt gets a results row. Wrong question count is **recomputed** with the existing correct-question-ids function (total questions minus correct), because older attempts may have a null value. Time taken is duration × 60 minus time remaining, which is null for untimed exams.
- Status, score and wrong question count are dropped from the attempt row. Every RPC and service that read them reads from results.
- API contract: attempt responses keep exposing score, status, wrong-question count and time taken, now sourced from results. Time taken is new on the wire and nullable.

### Slice 2: Tags

- The exam type table is **renamed to tags**, and the exam column referencing it is renamed from type id to **tag id** (not null).
- New tag columns:
  - `code`: text, not null, **globally unique**, lowercase letters and digits only (`^[a-z0-9]+$`, e.g. `full`, `people`, `process`, `environment`). The API and URLs address a tag by code.
  - `track_id`: nullable. Null means a shared tag. Only `full` is shared — a content convention, not enforced by the database.
  - `display_order`: smallint, unique per track, deferrable initially deferred. It orders the category sections; `full` has order 0.
  - `color_hex_code` (renamed from `colour`): `#RRGGBB`, checked by the database, nullable (null falls back to a neutral style). Replaces the old design-token keys.
- Backfill: existing row 1 becomes `full` (shared, `#9a6b2f`). Existing row 2 becomes `legacy` (PMP track, `#7b4d8e`) and is never linked from the UI. New category tags arrive with new content.
- No trigger ties an exam's tag to the exam's track (accepted risk).
- **New endpoint** `GET /api/tracks/:trackId/tags`, with the same auth and enrollment gate as the track's exam list. It returns `{ tags: Tag[] }`: the track's own tags plus the shared ones, sorted by `display_order`, whether or not they list any exam. From slice 4, archived tags are left out. The frontend separates `full` from category tags.
- Wire shape (`Tag` replaces `ExamType`):

  ```ts
  Tag = { id: number; code: string; name: { ar: string; en: string }; color_hex_code: string | null; display_order: number; archived_at: string | null }
  ```

- `FULL_TAG_CODE = "full"` is a single constant in the shared schema package, used by both the API and the frontend.
- Exam shape: an exam carries its whole `tag` (`Tag`) instead of `type_id`. The track exams response renames `types` to `tags`, kept only until slice 3 for the existing filter.
- **Attempt history must not depend on the exam list.** Attempts carry their whole exam (bilingual name and tag, without config), joined server-side, so history renders without fetching the exam list.
- Frontend: no new pages in this slice. Existing exam cards read the tag off the exam; the tag's colour appears only on the tag chip.

### Slice 3: Tag-filtered exam lists and catalog navigation

- `GET /api/tracks/:trackId/exams?tag=<code>`:
  - `tag` is **required**. Missing returns 400 (validation error code).
  - Unknown code returns **404 `NOT_FOUND`**.
  - Known code with no caller-visible exams on this track returns **200 with an empty list**.
  - Response is `{ exams: ExamDetails[] }`. The `tags` array (renamed from `types` in slice 2) is **removed**; tags come only from the tags endpoint.
  - Sorted by exam `display_order`.
- Exam `display_order` becomes **per (track, tag)**: unique on (track id, tag id, display order), deferrable initially deferred. The identity default is dropped, and new content sets explicit values. Backfill renumbers with a row number partitioned by (track, tag), keeping today's relative order.
- Frontend pages (all inside the existing feature/page layout; pages assemble only):
  - **Track page**: two cards, Full exams and Categories, plus the existing recent-attempts section. The cards are static. The track name comes from the existing tracks data.
  - **Categories page**: calls the tags endpoint, drops `full`, and renders one card per category tag.
  - **Exam list page**, parameterised by tag code: one page serves Full exams (`full`) and each category. It calls the exams endpoint with the tag only. Its heading is the tag's name, read from its exams' `tag` (for `full` too); an empty list falls back to a generic "Exams" label. Only the Track page's two cards use UI copy. A 404, or a missing `tag`, shows the not-found state.
  - Existing exam cards are reused.
- Routes (the tag travels as a query parameter, mirroring the API):

  | Page | Student | Supervisor |
  |---|---|---|
  | Track | `/tracks/:trackId` | `/tracks/:trackId/library` |
  | Categories | `/tracks/:trackId/by-category` | `/tracks/:trackId/library/by-category` |
  | Exam list | `/tracks/:trackId/exams?tag=<code>` | `/tracks/:trackId/library/exams?tag=<code>` |

- The old tag filter chips, name search, show-more and the flat browser are removed. The supervisor library moves to the same Track → Full exams / Categories → exam flow, keeping its inspect and preview actions in place of Start.
- Visual direction: modern, card-based, mobile-first. Use shadcn/ui primitives and Tailwind v4 with existing design tokens only; no new styling system, no plain CSS unless the styling guide allows it. Use lucide icons. Show skeletons while loading, plus the existing empty and error state components.

### Slice 4: Archiving

- Migration 022. Exams **and tags** get `archived_at` (timestamptz, nullable). Null means active. Clearing it reopens the exam or tag.
- The migration sets `archived_at = now()` on **every existing exam** and on the `legacy` tag. `full` is never archived: it is shared, so archiving it would hide Full exams on every track (convention, not enforced).
- **No role distinction.** The catalog never returns archived content, to anyone:
  - Tags endpoint: leaves out archived tags.
  - Exams endpoint: leaves out archived exams; an archived tag is **404 `NOT_FOUND`**, like an unknown code.
- Exam and tag wire shapes gain `archived_at: string | null` (returned, not used by the UI).
- `start_attempt` returns a new result **`archived`** when the **exam** is archived, mapped to **410 `EXAM_ARCHIVED`**, which the frontend shows as "no longer available". A tag's archive state never blocks starting: an active exam in an archived tag is unreachable in the catalog but still startable through the API.
- Archiving blocks **only** starting. Save, submit, review and the supervisor question viewer and preview keep working on archived exams.
- Starting is a button action, not a URL, so there is no start deep link. `EXAM_ARCHIVED` shows as a "no longer available" toast wherever Start is pressed; history and review links keep working.
- `seed_demo.sql` reopens its four demo exams, runs its journeys, and archives them again, so the demo student holds completed and in-progress attempts on archived exams.
- **Release note:** after this slice, the catalog is empty until new content is migrated in.

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
| 2 | `GET /tracks/:id/tags` (student, sup) | Track's tags + shared, sorted by display order; `full` first |
| 2 | `GET /tracks/:id/tags` (not enrolled) | Same refusal as the exam list today |
| 2 | List attempts | Each attempt carries its exam (name, tag) |
| 3 | `GET /tracks/:id/exams` (no tag) | 400 |
| 3 | `GET /tracks/:id/exams?tag=nope` | 404 `NOT_FOUND` |
| 3 | `?tag=<valid, nothing visible>` | 200, empty list |
| 3 | `?tag=full` | Exams ordered by per-tag display order; no `tags` key |
| 4 | `?tag=full` after migration (student, sup) | 200, empty |
| 4 | `?tag=legacy` after migration (student, sup) | 404 `NOT_FOUND` |
| 4 | `/tags` (student, sup) | `full` only; no `legacy` |
| 4 | Start an archived exam | 410 `EXAM_ARCHIVED` |
| 4 | Save / submit / review an attempt on an archived exam | Works |
| 5 | Start twice on the same exam | Second returns `in_progress` + same id; one row |
| 5 | Two parallel starts | Exactly one attempt created |
| 6 | Complete 11 attempts on one exam | 10 remain; oldest gone; other exams untouched |
| 6 | Lower the track's limit to 3 (SQL) | Every student trimmed to 3 per exam immediately |
| 6 | Migration on data with >10 per exam | Migration aborts, listing offenders |

Prior art: no automated tests exist in the repo. Checks follow the `DO $$ … RAISE EXCEPTION` guard pattern already used in the attempts migration for pre-flight data validation.

## Out of Scope

- Category or task tables, hierarchy, hidden tasks, question sets (considered and rejected in favour of tags).
- Any admin UI for creating tags, ordering, archiving or editing limits (content changes stay in migrations).
- A reorder API or UI.
- Enforcing that a question belongs to at most one category exam (true today, not enforced).
- A trigger tying an exam's tag to its track.
- New question types (the question shape stays type-agnostic; nothing new is built).
- New exam content (PMP/RMP categories and their exams arrive in separate migrations).
- Automated test infrastructure.
- Changes to the client-side retry-wrong session, breaks, timer or session persistence.

## Further Notes

- **Terminology:** UI and code use "full" (not "mock") for full exams. "Category" is the UI term for any tag other than `full`. Categories are not PMI domains.
- **Assumptions to verify before running:** (1) 020 has never run outside local Docker; if it has, convert the 020 edits into a patch migration. (2) No student has more than 10 attempts on one exam; the slice 6 pre-flight confirms it.
- **Decisions added during spec writing** (confirm during review): attempts carry their exam (slice 2), because history can no longer borrow names from an untagged exam list; and the supervisor library adopts the same tag-based navigation (slice 3).
- After implementation, update the database, backend and frontend guides in `.claude/skills/` to describe tags, archiving and the attempt rules.
