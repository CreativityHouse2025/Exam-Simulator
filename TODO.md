# TODO

### Expected behaviour change

Newest sign-in wins, silently. A student displaced by a second sign-in gets no message — they hit a
401 and land on the sign-in page, up to the JWT expiry later, possibly mid-exam. Exam progress is
client-side so answers survive, but the attempt-save call fails first. Previously the *second*
sign-in was blocked with `SESSION_CONFLICT` and the first device was untouched.

---

## Tracks migration rollout (010–017)

Status as of 2026-09-22: **staging fully migrated (001→017)**. Production untouched, still at `009`.

### Blocking production — resolve before any prod push

- [ ] **1. Resolve the ar/en bank conflicts in exams 1, 3 and 5.** Review
      `src/data/bank-conflicts.pdf` (8 questions, Arabic only, with the exam each resolves to).
      Then drop the ids from `EXCLUDED_EXAM_IDS` in `scripts/generate-content-migrations.py`,
      update `EXPECTED`, re-run the generator, and commit the regenerated `011` and `012`.

      **This is a hard prerequisite, not cleanup.** Staging proved it: `013` guard 2b aborted the
      push with *"24 attempt(s) reference exam id(s) [1] with no exams row"*. Production is at `009`
      with real attempts, so the same guard fires there if any sit on exams 1, 3 or 5 — and those
      are real student results that must not be deleted.

      It has to happen *before* the push, because the exams can only return by **regenerating 011
      and 012**. Appending an `018` does not work: `013`'s guard runs first and would still abort.
      Once 011/012 are applied to a database, that database can no longer take exams 1/3/5 without
      a reset — which is why staging cannot be used to rehearse the fix.

- [ ] **2. Check prod's exposure first** — decides how urgent step 1 is:
      ```sql
      select exam_id, count(*) from public.exam_attempts
       where exam_id in (1,3,5) group by 1 order by 1;
      ```
      Also worth confirming prod really is at `009` (the June dump showed `007`):
      ```sql
      select to_regtype('public.user_role') is not null      as has_008,
             to_regproc('public.search_students') is not null as has_009;
      ```

- [ ] **3. Confirm prod's migration history is populated.** Staging had the `009` schema but an
      empty `supabase_migrations.schema_migrations`, so `db push` tried to replay `001` and died on
      `relation "users" already exists`. Fixed there with
      `supabase migration repair --status applied 001 … 009`. Check whether prod needs the same
      before pushing — `supabase migration list --linked` against prod will show it.

### Staging — remaining manual steps

- [ ] **4. Create the `on_email_confirmed` trigger.** `supabase/local/bootstrap.sql` is a seed, not
      a migration, so staging has no trigger on `auth.users`: a signup authenticates but never gets
      a `public.users` row. Run in the SQL editor:
      ```sql
      drop trigger if exists on_email_confirmed on auth.users;
      create trigger on_email_confirmed
        after update on auth.users
        for each row
        when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
        execute function public.create_user_profile();
      ```
      Production already has this trigger (dashboard-created). It is the reason `015` had to replace
      `create_user_profile()` and not `handle_email_confirmed()` — see `supabase/legacy/README.md`.

- [ ] **5. Load the demo seeds**, in order: `seed.sql` → `seed_tracks.sql` → `seed_demo.sql`.
      Run each as one script in a single editor tab — `seed_demo.sql` defines a `pg_temp` helper and
      will not survive being executed statement-by-statement. Each file asserts its own outcome, so
      a wrong landing raises instead of half-seeding.

- [ ] **6. Assign the supervisor role** to whichever account should have it (manual, by hand).

### Known issues and follow-ups

- [ ] **New signups get no track access.** After `015`, `create_user_profile()` no longer grants six
      months and nothing issues an enrollment, so a brand-new user can authenticate but open no
      track. Open product decision — an enrollment has to come from somewhere (signup trigger,
      admin action, or purchase webhook).

- [ ] **Multi-select questions are new to the product.** 8 of the 459 RMP questions have more than
      one correct answer (3 with two, 5 with three) and 5 of them carry 5 choices.
      `attempt_correct_question_ids` grades by exact set match, so partial credit does not exist.
      Confirm the exam UI renders checkboxes rather than radios when `questions.answer_count > 1`.

- [ ] **Arabic text corruption in the RMP banks.** 5 instances of mangled lam-alef ligatures
      (`المشكالت` for `المشكلات`, `أصاً` for `أصلاً`) across the two Arabic RMP files. Cosmetic but
      student-visible in explanations. The PMP banks are clean. Fix in `src/data/exam/ar/` and
      re-run the generator.

- [ ] **`passing_rate` and break duration for RMP were assumed.** `017` sets `passing_rate = 75.00`
      and the break to 10 minutes, both copied from PMP Full because they were never specified.
      Confirm or change in `RMP_CONFIG` in `scripts/generate-content-migrations.py`.

- [ ] **RMP question ids are shifted +863 from their bank ids.** Bank files number themselves
      3138–3596; the database holds 4001–4459 (`RMP_QUESTION_ID_BASE`). PMP ids occupy 0–3137 with
      no row above 3137, so no remap was actually required — set the constant to `3137` to drop it.
      **Only worth doing before prod holds these ids**: `exam_attempts.question_ids_snapshot` is an
      unchecked `integer[]`, so changing them later silently repoints old attempts.

- [ ] **`016` no longer reverses Supabase's default privileges** (deliberate — it manages only the
      objects it names). A table or function added to `public` afterwards still inherits
      `GRANT ALL … TO anon, authenticated`. For a table that is survivable: `rls_auto_enable` turns
      RLS on and a grant buys nothing without policies. **For a `SECURITY DEFINER` function it is
      not** — a definer routine ignores RLS. Every migration adding one must carry its own REVOKE
      and be listed in `016` section 3.
      Local asymmetry: there is no `rls_auto_enable` on a local stack, so a new table there gets
      neither RLS nor a revoke until it is added to `016`'s list.

- [ ] **`seed.sql`'s bulk attempts are shallow.** The three attempts per student are hand-written:
      `wrong_questions` NULL, no `attempt_answers` rows, and a pasted `config_snapshot` literal that
      must be kept in sync with `exam_config` by hand. Fine for supervisor list volume, but opening
      one shows an empty review screen. Rebuild through the RPCs like `seed_demo.sql` does if the
      demo needs them to be openable.
