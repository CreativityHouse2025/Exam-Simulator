-- LOCAL DEVELOPMENT ONLY — not a migration, never applied to production.
--
-- One object remains here: the trigger on auth.users. It exists in production
-- but was created out-of-band through the Supabase dashboard, so no migration
-- describes it, and a freshly reset local database would not have it.
--
-- Loaded by [db.seed].sql_paths in supabase/config.toml, ahead of seed.sql.
--
-- What used to be here and no longer is:
--
--   * The GRANT SELECT list. Table and routine privileges are now stated
--     explicitly in supabase/migrations/016_privileges.sql, which runs in every
--     environment. Keeping a hand-maintained copy here meant local and
--     production could disagree silently, and the list had to be extended by
--     hand for every new table.
--
--   * The create_user_profile() body. 015_user_enrollments.sql defines it, so
--     it is real schema now rather than something local had to mirror. Do not
--     re-create it here: this file runs AFTER migrations, so a definition here
--     would silently overwrite the migration's version.

-- --- Profile creation on email confirmation -----------------------------------
-- Mirrors the production `on_email_confirmed` trigger. Signup stores the profile
-- fields in auth user metadata and never inserts into public.users itself; this
-- trigger is what materialises the row. The function it calls comes from
-- migration 015.
--
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
  execute function public.create_user_profile();
