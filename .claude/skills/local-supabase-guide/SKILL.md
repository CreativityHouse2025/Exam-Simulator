---
name: local-supabase-guide
description: "Running the Exam Simulator's Supabase stack locally in Docker — the npm db:* scripts that wrap the CLI, the unsuffixed SB_URL/SB_PUBLISHABLE_KEY/SB_SECRET_KEY contract shared by local and production, the seeded accounts and ports, how a migration is written and replayed locally before it ever reaches production, and which flows (signup, email, single-session) do not work the same way locally. Use this skill before starting, resetting, or debugging the local database, when regenerating api/_lib/database.types.ts, when an API call fails with a missing-environment-variable error, or when local behaviour diverges from the deployed app. Routes on to database-guide for what goes inside a migration."
---

# Local Supabase Guide (Docker)

## Overview

The whole Supabase stack — Postgres, Auth, PostgREST, Storage, Studio, a fake SMTP inbox — runs
on the developer's machine in Docker. There is no shared remote development project: local **is**
the development database. That makes `supabase/migrations/` the only description of the schema,
and replaying it locally the only way to know it replays at all.

The CLI is a **devDependency** (`supabase` in `package.json`), not a global install. Every command
below goes through npm, so every developer runs the same pinned version.

## Prerequisites

- Docker Desktop installed and **running** (`docker info` must succeed). The stack pulls ~10 images
  on first start; expect several GB and a slow first boot.
- `npm install` has been run.
- A `.env` at the repo root — copy `.env.example` and fill in the Supabase values printed by the
  stack (see **Environment wiring**).

## Commands

```bash
npm run db:start   # supabase start     — boot the stack, print URLs and keys
npm run db:reset   # supabase db reset  — drop, replay every migration, run supabase/seed.sql
npm run db:stop    # supabase stop      — stop containers, keep the data volume
npm run db:types   # regenerate api/_lib/database.types.ts from the LOCAL schema
npx supabase status          # reprint URLs and keys for a running stack
npx supabase status -o env   # same, as KEY=value lines ready to paste into .env
```

`db:reset` is destructive by design: it wipes local data and rebuilds from migrations plus seed.
That is the point — if a reset does not reproduce the schema you are working against, the
migrations are wrong, not the reset.

## Ports

All from `supabase/config.toml` — change them there, never by hand in a container.

| Service | URL |
| --- | --- |
| API (PostgREST + Auth) | `http://127.0.0.1:54321` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | `http://127.0.0.1:54323` |
| Inbucket (captured emails) | `http://127.0.0.1:54324` |
| Analytics | `http://127.0.0.1:54327` |

## Environment wiring

`api/_lib/supabaseClient.ts` reads three **unsuffixed** variables:

```
SB_URL
SB_PUBLISHABLE_KEY
SB_SECRET_KEY
```

The same three names are used in production (set in the Vercel project) and locally (set in
`.env`). Nothing in the code branches on environment — pointing the API at a different Supabase
is purely a matter of which values `.env` holds. Do not reintroduce `_LOCAL`/`_DEV`/`_PROD`
suffixes; a single name is what keeps deployed and local code identical.

Local values come from `npx supabase status` after the stack is up. They are the CLI's fixed
development keys — identical on every machine, worthless outside localhost, and therefore safe to
commit in `.env.example`.

`.env` is read by `vercel dev`, which is what serves `/api`. Plain `npm run dev` (Vite alone) does
not run the serverless functions, so it never touches Supabase at all.

## Objects production has that the migrations do not

`supabase/migrations/` does **not** describe production in full. Two things were applied to the
hosted project out-of-band and exist in no migration:

- **Table privileges.** `service_role` needs `SELECT` on `public.users`, `public.exam_attempts`
  and `public.exam_attempt_questions`. Without them every API read fails with PostgREST `42501
  permission denied for table users`, which `authService.signin` reports as the much less helpful
  `SIGNIN_FAILED: Failed to retrieve user profile`.
- **The `on_email_confirmed` trigger** on `auth.users`. Sign-up never inserts into `public.users`
  — there is no `.insert()` anywhere in `api/` — so this trigger is what materialises the profile
  from the auth user's metadata and sets the six-month expiry.

Both live in `supabase/local/bootstrap.sql`, loaded by `[db.seed].sql_paths` ahead of `seed.sql`.
It is **not a migration** and is never applied to production. If the production definitions
change, update that file to match.

Consequences worth knowing:

- The trigger is `AFTER UPDATE`, exactly as production has it. Locally `enable_confirmations` is
  `false`, so GoTrue stamps `email_confirmed_at` during the INSERT and the trigger never fires for
  a locally created user. Seeded accounts insert their own profiles, so this only matters for
  sign-up, which is blocked by the HighLevel check anyway.
- Do not make it fire on INSERT to "fix" that: `seed.sql` creates auth users with
  `raw_user_meta_data = '{}'`, so the trigger would insert a NULL `first_name` into a NOT NULL
  column and break `db:reset`.

Anything a new table needs — a grant, a trigger, an RLS policy — must be added here as well as to
production, or the next reset will produce a database the API cannot read.

## Seeded accounts

`supabase/seed.sql` runs on every `db:reset`. Password for every seeded account is `password123`.

| Email | Role | Notes |
| --- | --- | --- |
| `supervisor@local.test` | supervisor | 365-day expiry |
| `student@local.test` | student | 365-day expiry, 3 exam attempts |
| `amira.hassan@example.com` … 9 others | student | 30-day expiry, 3 attempts each — fodder for student search |

Every student gets one completed pass, one completed fail, and one in-progress attempt, so
attempt history and the resume flow have data without clicking through an exam.

Add fixtures by editing `seed.sql`, not by inserting through Studio — a Studio insert vanishes on
the next reset and cannot be reviewed in a diff.

## Adding a migration

1. Create `supabase/migrations/NNN_short_snake_case.sql` **by hand**, taking the next zero-padded
   number. Do not run `supabase migration new` — it emits timestamped filenames and this repo
   numbers sequentially (see `database-guide` for what belongs inside the file).
2. `npm run db:reset` — this replays the full history, so it catches a migration that only works
   against your current database.
3. `npm run db:types` if the change touches a table or a function signature, then commit
   `api/_lib/database.types.ts` alongside the migration. The script passes `--schema public`
   deliberately — the committed file covers `public` only, and dropping the flag adds a
   `graphql_public` block that has nothing to do with your change.

Regenerating from local emits the schema **as the migrations describe it**, which is not
necessarily what production currently runs. If a migration has not been applied to production
yet, its tables appear in the generated types — check the diff before committing.

`supabase db push` applies migrations to a **linked remote project**. This repo is deliberately
not linked; production migrations are applied through the Supabase dashboard. Do not run `push`
or `link` to "make it work".

## What does not behave like production

- **Sign-up calls HighLevel.** `api/_lib/services/offerVerifier.ts` hits the live
  `services.leadconnectorhq.com` API to verify a paid offer, regardless of which Supabase you
  point at. Without `HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN` and
  `HIGHLEVEL_SUBACCOUNT_LOCATION_ID` sign-up fails at that step — sign in with a seeded account
  instead of creating one.
- **Emails are captured, not sent.** Password-reset and confirmation mails land in Inbucket at
  `http://127.0.0.1:54324`. Email confirmation is disabled locally (`auth.email.enable_confirmations
  = false`), so a newly created user can sign in immediately.
- **Single session per account is not enforced.** That rule is a hosted-project Auth setting, not
  something `config.toml` reproduces (see `auth-rbac-guide`). Locally the same account can hold
  sessions on several devices; do not "fix" that in application code.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `Missing required environment variable: SB_URL` | `.env` absent or missing the three Supabase values. `npx supabase status -o env` prints them. |
| `failed to connect to docker daemon` | Docker Desktop is not running. |
| `port 54322 is already allocated` | Another Supabase project is up. `npx supabase stop` in that project, or change the port in `config.toml`. |
| Stack is up but schema is empty | `db:start` restores the previous volume; it does not apply migrations. Run `npm run db:reset`. |
| Reset fails partway through a migration | The migration is not replayable from scratch. Fix that migration — do not patch the database by hand. |
| `WARNING: Analytics on Windows requires Docker daemon exposed on tcp://localhost:2375` | Harmless. `analytics` is enabled in `config.toml` and cannot reach the daemon on Windows; the rest of the stack starts normally. |
| `WARN: config section [inbucket] is deprecated` | Harmless on the pinned CLI version — the section still works. Renaming it to `[local_smtp]` would break older CLI versions. |
| Containers wedged after a crash | `npx supabase stop --no-backup` discards the volume, then `npm run db:start`. |

## Related skills

- **What goes inside a migration or an RPC → invoke `database-guide`.** This skill covers running
  the database; that one covers changing it.
- **An endpoint failing against the local stack → invoke `backend-guide`** for the middleware chain
  and error contract.
- **Roles, expiry, or session behaviour differing from production → invoke `auth-rbac-guide`.**
