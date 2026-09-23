-- =============================================================================
-- Migration 015: account expiry becomes track enrollment
--
-- `users.expires_at` gated whether an account could sign in at all: a 6-month
-- clock stamped at signup, checked on sign-in and on every token refresh, and
-- enforced by revoking every session once it passed.
--
-- That is no longer how access works. An account signs in indefinitely; what a
-- user may actually DO is decided entirely by `enrollments` — an active
-- enrollment opens a track, an expired one closes it, and the account itself is
-- never the gate. The two clocks were distinct anyway (`users.expires_at` vs
-- `enrollments.expires_at`, same name, unrelated meanings), and keeping the
-- account one only invited them to be confused for each other.
--
-- So the account clock is not discarded, it is MOVED: every existing student
-- gets a PMP enrollment carrying their own dates, and only then is the column
-- dropped. The order below is not stylistic — the backfill reads the column
-- that the last step destroys.
--
-- SUPERVISORS ARE NOT ENROLLED HERE. Track access requires an active
-- enrollment for both roles, so a supervisor sees nothing until someone grants
-- one by hand. That is deliberate: which accounts supervise is not something a
-- migration should decide.
--
-- NOR IS ANY FUTURE SIGNUP. create_user_profile stops stamping an expiry and
-- nothing replaces it with an enrollment, so an account created after this
-- lands can sign in but can open no track until it is enrolled. The old flow
-- granted 6 months implicitly; this one grants nothing implicitly. If
-- self-serve signup is meant to keep working, an enrollment has to be issued
-- somewhere — that is a product decision, not a schema one.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Pre-flight. enrollments_expires_after_created (010) requires
--    expires_at > created_at, and the backfill below supplies both from
--    public.users. create_user_profile always stamped created_at + 6 months, so
--    no row should fail — but a hand-edited expiry would, and the INSERT would
--    abort the migration with a constraint name and no ids. Name them instead.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_bad INTEGER;
  v_ids TEXT;
BEGIN
  SELECT count(*), string_agg(u.id::TEXT, ', ' ORDER BY u.id::TEXT)
    INTO v_bad, v_ids
    FROM public.users u
   WHERE u.role = 'student'
     AND u.expires_at <= u.created_at;

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'Migration 015: % user(s) have expires_at <= created_at and cannot become an enrollment: [%]',
      v_bad, v_ids;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 2. Every student becomes a PMP enrollee, carrying their own dates.
--
--    created_at is the profile's own created_at rather than now(), so the
--    enrollment window is the window the account actually had. expires_at is
--    the account expiry verbatim.
--
--    An account whose expiry has already passed therefore lands with an
--    enrollment that is already expired, and loses access to the track on
--    deploy. That is the intended reading: under the old rule the account had
--    expired too, and it could not sign in at all. This is strictly less
--    restrictive — they can still sign in and read their attempt history, which
--    is gated by ownership rather than enrollment.
--
--    ON CONFLICT DO NOTHING makes this re-runnable. It covers the
--    enrollments_no_overlap exclusion constraint as well as the primary key:
--    DO NOTHING is the one conflict action Postgres accepts for an exclusion
--    constraint.
-- ---------------------------------------------------------------------------
INSERT INTO public.enrollments (user_id, track_id, created_at, expires_at)
SELECT u.id,
       '33333333-3333-4333-8333-333333333333'::uuid,
       u.created_at,
       u.expires_at
  FROM public.users u
 WHERE u.role = 'student'
ON CONFLICT DO NOTHING;


-- ---------------------------------------------------------------------------
-- 3. Report what landed. Not a guard — an already-expired enrollment is a
--    correct outcome, not an error. But the number of students who lose track
--    access the moment this deploys belongs in the migration output rather than
--    in a support ticket a week later.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_total   INTEGER;
  v_expired INTEGER;
BEGIN
  SELECT count(*), count(*) FILTER (WHERE e.expires_at <= now())
    INTO v_total, v_expired
    FROM public.enrollments e
   WHERE e.track_id = '33333333-3333-4333-8333-333333333333'::uuid;

  RAISE NOTICE 'Migration 015: % PMP enrollment(s), of which % are already expired.',
    v_total, v_expired;
END $$;


-- ---------------------------------------------------------------------------
-- 4. create_user_profile — stop stamping an expiry.
--
--    Signup stores the profile fields in auth user metadata and never inserts
--    into public.users itself; this trigger function materialises the row when
--    the email is confirmed. It previously also set expires_at to
--    now() + 6 months.
--
--    THE NAME MATTERS. This function was created out-of-band in production via
--    the dashboard, so migrations never described it, and the trigger
--    on_email_confirmed on auth.users points at THIS name. An earlier draft of
--    this migration replaced `handle_email_confirmed` instead — a name that
--    exists nowhere in production — which would have left the real function
--    writing a column step 5 removes, breaking every signup silently.
--    supabase/local/bootstrap.sql mirrors this function for local replay; keep
--    the two in step.
--
--    SET search_path = '' is added here and was not on the production
--    definition. A SECURITY DEFINER function without it resolves unqualified
--    names through the caller's search_path, which is a privilege-escalation
--    route. Every reference below is already schema-qualified, so this costs
--    nothing.
--
--    Replaced BEFORE the column is dropped. The reverse order leaves a trigger
--    that raises on the next signup.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, first_name, last_name, highlevel_id)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'highlevel_id'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- 5. Drop the column.
--
--    Nothing reads it any more: assertAccountNotExpired and every caller are
--    gone, and the User type no longer carries the field.
--    enrollments.expires_at is untouched and is now the only expiry in the
--    system.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  DROP COLUMN expires_at;
