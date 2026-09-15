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
guessable — `users` carries `expires_at` and `role` columns that drive account expiry and access
control, and assuming a conventional shape will produce code that compiles and fails in production.

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
- **Anything touching `users.role`, `users.expires_at`, or `auth.sessions` → invoke
  `auth-rbac-guide`** before changing it; those columns back the access-control and
  single-session rules.
