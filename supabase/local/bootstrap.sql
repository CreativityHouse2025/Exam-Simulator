-- LOCAL DEVELOPMENT ONLY — not a migration, never applied to production.
--
-- These objects already exist in the production database but were created
-- out-of-band (Supabase dashboard), so `supabase/migrations/` does not describe
-- them. Without them a freshly reset local database is not a faithful copy:
-- every API read fails with `permission denied for table users`.
--
-- Loaded by [db.seed].sql_paths in supabase/config.toml, ahead of seed.sql.
-- If production's definitions change, change them here too.

-- --- Table privileges ---------------------------------------------------------
-- The API reads tables with the secret key (service_role) and writes only through
-- security-definer RPCs, so SELECT is the whole requirement. anon and authenticated
-- get nothing: the frontend never talks to Supabase directly.
--
-- Production does not need this: migrations are applied through the dashboard, which
-- runs as `postgres` and picks up Supabase's default privileges. The CLI's local
-- replay does not, so every table a migration creates has to be listed here or its
-- first read fails with `permission denied for table <name>`.
grant select on
  public.users,
  public.exam_attempts,
  public.attempt_answers,
  public.offered_breaks,
  public.tracks,
  public.enrollments,
  public.exams,
  public.exam_type,
  public.exam_config,
  public.breaks,
  public.allowed_config,
  public.questions,
  public.choices,
  public.exam_questions
to service_role;

-- --- Profile creation on email confirmation -----------------------------------
-- Mirrors the production `on_email_confirmed` trigger. Signup stores the profile
-- fields in auth user metadata and never inserts into public.users itself; this
-- trigger is what materialises the row. It no longer stamps an expiry: 019
-- dropped users.expires_at, and enrollments are the only expiry left.
create or replace function public.handle_email_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.users (id, first_name, last_name, highlevel_id)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'highlevel_id'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- AFTER UPDATE only, matching production. Note that local config disables email
-- confirmation (auth.email.enable_confirmations = false), so GoTrue stamps
-- email_confirmed_at during the INSERT and this trigger never fires for a locally
-- created user. Local sign-up is already blocked by the HighLevel offer check —
-- use the accounts in seed.sql, which insert their own profiles.
drop trigger if exists on_email_confirmed on auth.users;
create trigger on_email_confirmed
  after update on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_email_confirmed();
