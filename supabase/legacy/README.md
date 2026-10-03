# Legacy — superseded, never applied

Nothing in this folder runs. The Supabase CLI reads migrations only from
`supabase/migrations/`, and seeds only from the explicit `sql_paths` list in
`supabase/config.toml`, so these files are inert wherever they sit. They are
kept because they are the written record of how the schema was reasoned about,
and the comments in several of them explain decisions the replacements only
summarise.

## Why they could be replaced rather than appended to

Production was at migration `009` when this consolidation happened. Every file
below had been written, reviewed and replayed locally, but **none had ever been
applied to a deployed database** — so the usual rule (never edit an applied
migration, always add the next number) did not bind. Only the net effect of
`010`–`022` mattered, and that net effect is now `010`–`016`.

Two of them contradicted each other outright: `017` created a `submit_attempt`
returning a five-column table, and `021` dropped and recreated it four days
later returning a sentinel. Replaying both would have built the first function
purely to destroy it.

## Where each one went

| Legacy | Replacement |
| --- | --- |
| `010_drop_count_user_sessions_rpc.sql` | `010_tracks_and_question_schema.sql` (top) |
| `011_tracks.sql` | `010_tracks_and_question_schema.sql` |
| `012_remap_domain_exam_ids.sql` | `013_attempts_migration.sql` §1 |
| `013_content_tracks_exams.sql` | `011_content_catalogue.sql` (regenerated) |
| `014_question_tables.sql` | `010_tracks_and_question_schema.sql` |
| `015_question_banks.sql` | `012_question_banks.sql` (regenerated) |
| `016_attempts_cleanup.sql` | `013_attempts_migration.sql` |
| `017_attempt_rpcs.sql` | `014_attempt_rpcs.sql` |
| `018_attempt_totals_and_revision.sql` | `013_attempts_migration.sql` §10 + `014_attempt_rpcs.sql` |
| `019_drop_account_expiry.sql` | `015_user_enrollments.sql` |
| `020_attempt_wrong_questions.sql` | `013_attempts_migration.sql` §10 |
| `021_submit_attempt_stores_result.sql` | `014_attempt_rpcs.sql` |
| `022_question_answer_count.sql` | `010` (the column) + `012` (the trigger) |
| `generate-question-seed.py` | `scripts/generate-content-migrations.py` |
| `seed_fill_answers.sql` | nothing — see below |

## Two that changed rather than moved

**`019_drop_account_expiry.sql` targeted a function that does not exist.** It
replaced `public.handle_email_confirmed()`, but production's trigger
`on_email_confirmed` calls `public.create_user_profile()`. The bodies were
near-identical, which is presumably how the mistake survived review — but
replaying it would have created an orphan function, left the real one writing
`users.expires_at`, and then dropped that column. Every signup would have
failed. `015_user_enrollments.sql` targets the correct name, and also moves each
student's account expiry onto a PMP enrollment before the column goes.

**`seed_fill_answers.sql` has been dead for some time.** It inserts into
`exam_attempt_questions` with a `choices_order` column; the table was renamed to
`attempt_answers` and that column dropped. It is also absent from
`config.toml`'s `sql_paths`, so it had already stopped running.

## Restoring one

```bash
git log --oneline -- supabase/legacy/016_attempts_cleanup.sql
git show 41dc8ee:supabase/migrations/016_attempts_cleanup.sql
```

`41dc8ee` is the last commit in which these were the live migration set.
