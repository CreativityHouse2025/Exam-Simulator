# Spec: Exam tags, archiving and attempt rules

Status: ready for implementation. Resolved via `/grill-me` on 2026-10-09/10. Slices 6–7 revised via `/grill-me` on 2026-10-11 (the per-exam attempt limit was dropped); slices 5 and 7 revised again the same day (legacy duplicates auto-submitted, progress fields catalog-only, paging details). Slice 8 added via `/grill-me` on 2026-10-12 (the exam list returns its tag).

## Problem Statement

Students see one long, flat list of every exam in a track, filtered by two hardcoded "types" (Full / Domain). The business now organises content into categories and wants students to browse that way: pick a track, pick full exams or a category, then pick an exam.

The business also needs to retire old content without erasing student history, and the current attempt rules no longer match what the business wants:

- History is capped at 150 attempts per track, so one heavily retried exam can push every other exam's history out.
- A student can open any number of unfinished attempts on the same exam at once.
- Old exams cannot be taken off the shelf. Removing them would orphan the attempts that reference them.
- Signing in as another user in the same tab can show the previous user's cached data.

## Solution

Every exam stays a single row with a single **tag**. The tag says where the exam is listed:

- The shared `full` tag puts it under **Full exams**.
- A track-specific category tag (`people`, `process`, `environment`, …) puts it under **Categories**. A category lists one or more exams.

The question layer (questions, choices, exam questions, configs, breaks) is untouched.

Students navigate **Track → Full exams | Categories → (category) → exam**. Every page fetches its own data, so any URL works when opened cold.

Exams and tags can be **archived**. An archived exam disappears from the catalog and can no longer be started. It stays in the student's history and review, and an unfinished attempt on it can still be resumed and submitted. An archived tag disappears from the catalog; it does not block starting its exams. Archived content is hidden from every role, supervisors included. Every exam that exists today, and the `legacy` tag, are archived by this change; new content arrives in later migrations.

Attempts follow three rules:

1. A student can have at most one unfinished attempt per exam. The exam card offers to resume it instead of starting a new one.
2. Attempts are unlimited and never deleted automatically. History is paged.
3. A completed attempt's grade lives in its own results record.

Every exam the API returns tells the caller how many times they have completed it and which unfinished attempt, if any, they can resume.

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

16. As a student, when I already have an unfinished attempt on an exam, I want its card to offer "Resume last attempt" instead of Start, so that I don't lose answers or start a duplicate by mistake.
17. As a student, I want two tabs pressing Start at the same moment to result in a single attempt, so that I never end up with duplicates.
18. As a student, I want unlimited retries on an exam after finishing my previous attempt, so that I can practise as much as I like.
19. As a student, I want every attempt I make kept, so that heavy practice on one exam never erases any of my history.
20. As a student, I want my completed attempts to show score, pass/fail, wrong-question count and time taken, so that I can track improvement.
21. As a student, I want the time taken to show as not applicable on untimed exams, so that I'm not shown a meaningless number.
35. As a student, I want each exam card to show how many times I have completed that exam, so that I see my practice at a glance.
36. As a student, I want my history paged, with a choice of how many attempts per page (10 to 100), so that a long history stays fast and readable.
37. As a student, I want a clear message if I press Start in a stale tab where I already have an unfinished attempt, and the card to update to Resume, so that I'm never confused about my state.
38. As any user, I want to never see another account's data after signing in on the same browser, so that my data and theirs stay private.
39. As a student, I want an exam list page to show its category's name even when the category has no exams yet, so that I know where I am.

### Supervisor

22. As a supervisor, I want to browse a track the same way students do (Full exams / Categories / exams), so that I see what they see.
23. ~~Archived exams labelled for supervisors~~ — dropped: the business confirmed supervisors do not need archived content in the catalog.
24. ~~Archived-only categories visible to supervisors~~ — dropped, same reason.
25. As a supervisor, I want the question viewer and preview sessions to keep working for active and archived exams, so that I can audit any exam I can reach.
26. As a supervisor, I want a student's attempt history to show exam names even for archived exams, so that support conversations make sense.

### Business / content

27. ~~Per-track attempts-kept limit~~ — dropped 2026-10-11: attempts are unlimited.
28. ~~Lowering the limit trims history~~ — dropped, same reason.
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
| 6 | Wire contract and cache structure (refactor) | 5 |
| 7 | Unlimited attempts, per-exam progress, paged history | 6 |
| 8 | Exam list returns its tag | 7 |

Order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Refactor before features: slice 6 changes structure only, slice 7 adds the behaviour. Slices 1 and 5 can move earlier if needed.

Migrations: the existing uncommitted 019 (track code) stays as is. The existing uncommitted 020 (results) is edited in place, on the assumption that it has only ever run locally. Catalog changes go into a migration named for exam tags (021). Archiving goes into its own migration (022). Dropping the attempt cap goes into a migration named for unlimited attempts (023). Each migration is wrapped in a single transaction. When slices interleave across two migration files, the file content grows slice by slice, and `npm run db:reset` replays it every time.

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
  - **Exam list page**, parameterised by tag code: one page serves Full exams (`full`) and each category. It calls the exams endpoint with the tag only. Its heading is the tag's name, read from its exams' `tag` (for `full` too); an empty list falls back to a generic "Exams" label. *Superseded by slice 8: the heading is the returned tag's name, with no fallback.* Only the Track page's two cards use UI copy. A 404, or a missing `tag`, shows the not-found state.
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

- Legacy duplicates: before the index is built, every open attempt except the newest per (user, exam) is **auto-submitted** through `submit_attempt` with an empty answer diff, so it is graded on its stored answers and gains a results row. Any result other than `ok` aborts the migration.
- A partial unique index on attempts covers (user id, exam id) where `exam_state` is in progress. No cutoff: after the auto-submit, no duplicates remain.
- `start_attempt` first checks for an open attempt on that exam. If one exists, it returns a new result **`in_progress`** with the existing attempt's id and creates nothing. The index is the race backstop.
- Frontend: Start receiving `in_progress` shows a dialog (shadcn Dialog) offering **Resume**, which opens the existing attempt. *Superseded by slice 6: the API answers 409 `ATTEMPT_IN_PROGRESS` and the dialog is removed.*

### Slice 6: Wire contract and cache structure

A refactor: no new feature. Two visible changes only, the start-conflict toast and the end of the account-switch leak.

- **These wire schemas** in `shared/schemas` are the only exam and attempt response shapes. *Item* schemas are list entries; `*List` schemas wrap a list in a named key; `*WithQuestions` schemas are sessions.

  ```ts
  Exam                 = { id, track, tag, display_order, name, description, question_count, archived_at, config: ExamConfig }
  ExamList             = { exams: Exam[] }
  TagList              = { tags: Tag[] }
  ExamWithQuestions    = { exam: Exam; questions: DisclosedQuestion[] }
  Attempt              = { id, exam: Exam, exam_state, created_at, time_remaining, config_snapshot, total_questions, result, current_index, offered_breaks }
  AttemptWithQuestions = { attempt: Attempt; questions: AttemptQuestion[] | DisclosedAttemptQuestion[] }
  AttemptList          = { attempts: Attempt[] }   // slice 7 adds `total`
  ```

- `Exam` **always** carries `config`, including inside an attempt, even where unused. Inside an attempt, `config_snapshot` governs; `exam.config` is the exam's current config and must not be read for the session (JSDoc on the field says so). Its breaks are unordered there.
- **Deleted:** `ExamDetails`, `StartAttemptResponse`, `Revision`. `TrackExams` and `TrackTags` are renamed `ExamList` and `TagList`.
- A response's `data` is always an object, never a bare array, so it can grow (e.g. `total`) without a breaking change. Services return plain values (`Exam[]`, `Tag[]`, `Attempt[]`); the **handler** wraps them in the `*List` schema.
- Envelopes are `ApiResponse<schema>`:

  | Endpoint | Response |
  |---|---|
  | `GET /api/tracks/:trackId/exams?tag=` | `ApiResponse<ExamList>` |
  | `GET /api/tracks/:trackId/tags` | `ApiResponse<TagList>` |
  | `GET /api/exams/:examId/questions` | `ApiResponse<ExamWithQuestions>` |
  | `GET /api/attempts/:id/revision` | `ApiResponse<ExamWithQuestions>` — the parent exam and the wrong-or-unanswered subset (`parent_exam` becomes `exam`) |
  | `POST /api/attempts` | `ApiResponse<AttemptWithQuestions>`, 201 |
  | `GET /api/attempts/:id` | `ApiResponse<AttemptWithQuestions>` |
  | `GET /api/attempts?trackId=` | `ApiResponse<AttemptList>` |
  | `GET /api/students/:id/attempts?trackId=` | `ApiResponse<AttemptList>` |

- **Start conflict:** the RPC's `in_progress` result becomes **409 `ATTEMPT_IN_PROGRESS`** (new error code), a plain error with no data. It only happens in a stale tab, so the frontend shows a translated error toast. Slice 5's Resume dialog is removed. Slice 7's card makes resuming explicit.
- **User-scoped query keys:** every TanStack query key ends with the signed-in user's id, e.g. `["tracks", trackId, "exams", tagCode, userId]`. This applies to all queries, supervisor ones included. Each query-options factory takes `userId`; pages pass `user.id` from `useAuth()`. Nothing clears the cache on sign-in or sign-out: a previous user's entries are unreachable and expire with `gcTime`. The id goes **last** so a key prefix never needs it.

### Slice 7: Unlimited attempts, per-exam progress, paged history

- **Migration 023** (the existing attempt-limits file, new section) drops `trg_enforce_attempt_limit` and `enforce_attempt_limit()`. Attempts are never deleted automatically. No per-track or per-exam limit column. `TRACK_ATTEMPT_CAP` is removed from the attempt service.
- **Catalog exams gain two caller-specific fields.** Only `GET /api/tracks/:trackId/exams?tag=` returns them; attempts, the preview and revision keep plain `Exam`, since nothing there reads them:

  ```ts
  ExamWithProgress = Exam & { attempts_count: number; open_attempt_id: string | null }
  ExamList         = { exams: ExamWithProgress[] }
  ```

  - `attempts_count`: int ≥ 0, the caller's **completed** attempts on this exam.
  - `open_attempt_id`: uuid or null, the caller's in-progress attempt on this exam (at most one, by slice 5's index).

  Both are computed for the requesting user through PostgREST embeds filtered by user id. No new RPC. Supervisors get `0` / `null` in practice (not enforced).
- **Exam card:**
  - The count badge reads "Taken $1x" (`exams.taken`, copy unchanged in both languages), hidden at 0.
  - When `open_attempt_id` is set, Start is replaced by **"Resume last attempt"** (`exams.resume`; Arabic "استئناف المحاولة الأخيرة"), which opens that attempt through the existing open-attempt flow (no `POST /attempts`).
  - Removed: the "X attempts uncompleted" link and its `exams.in-progress` key, `statsByExamId`, `statsForExam`, `ExamAttemptStats`, and the attempts query on the track-exams page.
- **Paged history:** `GET /api/attempts?trackId=&page=&per_page=` and `GET /api/students/:id/attempts?trackId=&page=&per_page=`.
  - `page`: int ≥ 1, default 1. `per_page`: int from 10 to 100, multiple of 5, default 10. Anything else is 400 `VALIDATION_ERROR`.
  - `PER_PAGE_MIN = 10`, `PER_PAGE_MAX = 100`, `PER_PAGE_STEP = 5` live in the shared schema package and drive both the API validation and the UI's per-page select.
  - Newest first. A page past the end is 200 with an empty list.
  - `AttemptList` gains `total`: the user's attempt count in the track (every state) across all pages. One query: `count: "exact"` plus `range`. A page past the end makes PostgREST answer 416 `PGRST103`; only then a second, count-only query (`head: true`) supplies `total` for the empty page.
- **History pages** (student history and supervisor student attempts):
  - `page` and `per_page` live in URL search params. Invalid values fall back to the defaults client-side, so a hand-edited URL never triggers a 400.
  - Reuse the existing `Pager` component (moved to `src/components/` now that it is shared), plus a per-page select built from the constants. The URL's 1-based `page` maps to Pager's 0-based one. The header count reads `total`.
  - The Track page's recent attempts request `page=1&per_page=10` and show the first 5, sharing the cache with the history page's default view.
- **Cache freshness by `staleTime`, not invalidation** (revised 2026-10-12: a mutation-driven invalidation was tried and visibly reloaded pages):
  - The three queries a student's own actions change have `staleTime: 0`: track exams (progress fields), the student's attempts, and a student's attempts as a supervisor reads them. Every mount refetches in the background over the cached data, so no skeleton shows; `gcTime` is unchanged.
  - Every other query keeps its longer `staleTime`: catalogue, tags, question content and profiles do not change with start or submit.
  - Nothing calls `invalidateQueries`, and start and submit stay plain service calls.
  - A stale tab updates on its next mount or window focus, not in place. Pressing Start there still shows the `ATTEMPT_IN_PROGRESS` toast.

### Slice 8: Exam list returns its tag

- `GET /api/tracks/:trackId/exams?tag=` returns the requested tag next to its exams:

  ```ts
  ExamList = { tag: Tag; exams: ExamWithProgress[] }
  ```

  - `tag` is the tag the `tag` query parameter names, in the same `Tag` shape as the tags endpoint.
  - It is returned for an empty list too.
  - Each exam keeps its own `tag`: `Exam` stays the single exam shape (slice 6), so the duplication is accepted.
- Errors are unchanged: a missing `tag` is 400, and an unknown or archived tag is 404 `NOT_FOUND`.
- **Exam list heading** (student and supervisor): always the returned tag's name, in the user's language, for `full` too. The generic "Exams" fallback is removed. An empty category shows its own name above the empty state.
- No database change.

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
| 5 | Pre-migration duplicate open attempts on one exam, then migrate | Newest stays open; the rest are completed with a results row |
| 6 | Start twice on the same exam | Second is 409 `ATTEMPT_IN_PROGRESS`; one row |
| 6 | Any response carrying an exam | Exam has `config`, including inside attempts |
| 6 | `GET /attempts/:id/revision` | `{ exam, questions }` |
| 6 | Sign in as X, open history, sign out, sign in as Y (manual) | Y never sees X's data |
| 7 | Complete 151+ attempts in one track | All remain |
| 7 | `?tag=` with one completed and one open attempt on an exam | `attempts_count` 1, `open_attempt_id` = the open attempt; after submit, 2 and null |
| 7 | `?tag=` (sup) | `attempts_count` 0, `open_attempt_id` null |
| 7 | `/attempts?per_page=7`, `per_page=110`, `page=0` | 400 |
| 7 | 23 attempts, `per_page=10`, pages 1–4 | 10 / 10 / 3 / 0 rows; `total` 23 on each |
| 7 | Stale tab: press Start on an exam with an open attempt (manual) | Error toast; card shows Resume after refocusing the tab or reopening the list |
| 7 | Start an exam, go back to its list; submit it, go back again (manual) | No skeleton or reload; the card switches to Resume, then to Start with the count up by one |
| 8 | `?tag=full` | `tag` is the `full` tag; `exams` as before |
| 8 | `?tag=<valid, nothing visible>` | 200, `tag` present, `exams` empty |
| 8 | `?tag=nope`, `?tag=legacy` | 404 `NOT_FOUND`, no `tag` |
| 8 | Open an empty category page (manual, both languages) | Heading is the category's name, not "Exams" |

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
- **Assumption to verify before running:** 020 has never run outside local Docker; if it has, convert the 020 edits into a patch migration.
- **Decisions added during spec writing** (confirm during review): attempts carry their exam (slice 2), because history can no longer borrow names from an untagged exam list; and the supervisor library adopts the same tag-based navigation (slice 3).
- After implementation, update the database, backend and frontend guides in `.claude/skills/` to describe tags, archiving and the attempt rules.
