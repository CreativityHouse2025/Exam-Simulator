---
name: database-guide
description: "Supabase/Postgres conventions for the Exam Simulator — how numbered SQL migrations under supabase/migrations are written and applied, when logic belongs in an RPC instead of a service, the security-definer/search-path rules RPCs follow, how api/_lib/database.types.ts is regenerated, and where ad-hoc analytics queries live. Use this skill whenever adding or altering a table, column, index, trigger, or RLS policy, writing or changing a Postgres function or RPC, regenerating Supabase types, or debugging a query that returns the wrong rows or silently returns none. Also use before assuming a table's shape — read its migration first. Routes on to backend-guide for the service layer that calls these queries."
---

# Database Guide (Supabase / Postgres)

## Overview

Postgres lives in Supabase. The frontend never touches it — every read and write goes through a
Vercel serverless function (see `backend-guide`). This skill covers the conventions for changing
the schema and for deciding what belongs in SQL rather than TypeScript.

## Migrations

`supabase/migrations/` holds numbered, append-only SQL files:

```
001_user.sql
002_count_user_sessions_rpc.sql
003_attempts.sql
004_insert_attempt_rpc.sql
005_save_attempt_rpc.sql
006_break_columns.sql
007_save_attempt_rpc_breaks.sql
008_add_user_role.sql
009_search_students_rpc.sql
010_drop_count_user_sessions_rpc.sql
```

Rules that follow from that layout:

- **Never edit a migration that has already been applied.** Add the next number instead. The files
  are a replayable history; editing one means the deployed database and the repo disagree, and
  nothing will tell you.
- **Name the file after the change**, not the ticket: `NNN_short_snake_case.sql`.
- **Zero-pad to three digits** and take the next free number.
- When you change an existing RPC, write a new migration that `create or replace`s it — see
  `007_save_attempt_rpc_breaks.sql`, which supersedes `005`.

Before altering a table or writing a query against it, **read its migration**. The schema is not
guessable — `users` carries a `role` column, and `enrollments` the expiry, that drive access
control, and assuming a conventional shape will produce code that compiles and fails in production.

## Tags and catalog order (021)

`tags` (renamed from `exam_type`) says where an exam is listed. Every exam has exactly one
(`exams.tag_id`, not null).

- `code` — globally unique, **lowercase** letters and digits (`^[a-z0-9]+$`). The API and URLs
  address a tag by code, never by id.
- `track_id` — null means shared. Only `full` is shared, by convention; nothing enforces it, and
  nothing ties an exam's tag to the exam's track.
- `full` is the "Full exams" tag; every other tag is a category in the UI. `legacy` holds the old
  domain exams and is never linked from the UI.
- `tags.display_order` orders categories within a track (`full` is 0). `exams.display_order` orders
  exams **within one (track, tag)**, starting at 1. It has no identity default, so new content
  sets it explicitly.
- Both order uniques — `(track_id, display_order)` on tags, `(track_id, tag_id, display_order)` on
  exams — are `DEFERRABLE INITIALLY DEFERRED`. Reorder inside one migration transaction by
  rewriting the values freely; uniqueness is checked at commit, so swaps never collide.

## Archiving (022)

Content is retired, never deleted: `exams.archived_at` and `tags.archived_at` (nullable
timestamptz, null = active). Clearing the column reopens the row.

- **The catalog hides archived rows from every role** — supervisors included. That filter lives in
  the services (`archived_at IS NULL`), not in RLS or a view.
- **Only `start_attempt` enforces it in SQL**: an archived *exam* returns the sentinel `archived`
  and inserts nothing. A tag's archive state never blocks starting.
- Save, submit, review and revision never check either column — an attempt started before the
  archive finishes normally.
- **Never archive `full`.** It is shared, so it would empty Full exams on every track. Convention
  only; nothing enforces it.
- 022 archived every existing exam and the `legacy` tag. `seed_demo.sql` therefore reopens its four
  demo exams, runs its journeys through the real RPCs, and archives them again — keep that
  bracket if you add a journey, or `start_attempt` refuses it and `db:reset` fails.

## Attempt rules (020, 023)

- **A completed attempt's grade lives in `results`** (020), one row per attempt. `exam_state` is
  the source of truth for completion; `submit_attempt` flips it and inserts the row in one
  transaction. Grade an attempt only through `submit_attempt` — 023 does exactly that for its
  backfill rather than writing `results` by hand.
- **At most one open attempt per (user, exam).** A partial unique index
  (`exam_attempts_one_open_per_exam`, `WHERE exam_state = 'in-progress'`) backs `start_attempt`'s
  own check, which returns `in_progress` instead of inserting. 023 auto-submitted every older
  duplicate before building the index, so it covers every row with no cutoff.
- **Attempts are unlimited and never deleted automatically.** 023 dropped
  `trg_enforce_attempt_limit` and `enforce_attempt_limit()`; there is no cap anywhere, in SQL or
  in the services.

## When to write an RPC

Most reads belong in a service (`api/_lib/services/`). Reach for a Postgres function when the
operation needs to be atomic, needs to touch `auth.*` schemas the API client cannot query
directly, or would otherwise be several round trips — attempt insert/save and student search are
RPCs for one of those reasons.

Existing RPCs follow a consistent shape worth copying:

```sql
create or replace function public.search_students(p_query text, p_limit int)
returns table (...)
language sql
stable
security definer
set search_path = ''
as $$ ... $$;
```

- `security definer` is what lets the function read across schemas — which is exactly why
  `set search_path = ''` is mandatory alongside it. Without it, a definer function is vulnerable
  to search-path hijacking. Every schema reference inside must then be fully qualified
  (`public.users`, `auth.users`).
- `stable` for reads, `volatile` (the default) for writes.
- Prefix parameters with `p_` to avoid collisions with returned column names.
- Sanitise input **before** it reaches the function and say so in a comment — `search_students`
  expects a query string the backend has already lowercased and wildcard-escaped.
- Return a well-defined `table (...)`, not `setof record`, so the generated types are usable.

## Generated types

`api/_lib/database.types.ts` is generated from the live schema, not hand-written. After a
migration changes any table or function signature, regenerate it and commit the result; the
backend's type safety depends on it matching reality.

## Ad-hoc analytics

`supabase/query/` holds one-off analytical SQL and its exports (e.g. most-missed questions).
These are not migrations and are not applied to the schema — keep them there rather than
letting an analysis query drift into `migrations/`.

## Related skills

- **The service or handler that calls this query → invoke `backend-guide`.** Query results are
  shaped in the service layer; handlers never talk to Supabase directly.
- **Anything touching `users.role`, `enrollments`, or `auth.sessions` → invoke
  `auth-rbac-guide`** before changing it; those columns back the access-control and
  single-session rules.
