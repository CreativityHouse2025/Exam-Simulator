-- =============================================================================
-- Migration 019: account expiry is removed
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
-- Order matters here. `handle_email_confirmed` writes the column, so it is
-- replaced BEFORE the column is dropped; the reverse order leaves a trigger that
-- raises on the next signup.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. handle_email_confirmed — stop stamping an expiry
--
-- Signup stores the profile fields in auth user metadata and never inserts into
-- public.users itself; this trigger materialises the row when the email is
-- confirmed. It previously also set expires_at to now() + 6 months.
--
-- This function was created out-of-band in production (via the dashboard), so
-- migrations never described it and `supabase/local/bootstrap.sql` carries a
-- hand-written mirror for local replay. Its production body was confirmed
-- identical to that mirror before this replacement was written. Keep the two in
-- step: bootstrap.sql re-creates this function at seed time, so a change here
-- that is not made there is silently undone locally.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_email_confirmed()
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
-- 2. Drop the column
--
-- Nothing reads it any more: assertAccountNotExpired and every caller are gone,
-- and `User` no longer carries the field. `enrollments.expires_at` is untouched
-- and is now the only expiry in the system.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  DROP COLUMN expires_at;
