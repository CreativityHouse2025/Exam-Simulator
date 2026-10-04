-- =============================================================================
-- 018 — Raise the per-track attempt cap to 150 and drop the per-user cap.
--
-- Supersedes the body of public.enforce_attempt_limit from 013 §11:
--
--   150 per (user_id, track_id), track resolved through exams   (was 25)
--   per user_id across every track                              (was 50, dropped)
--
-- The per-track cap alone bounds an account's total at 150 × number of tracks,
-- so the per-user cap is redundant. Left in place it would also cut a single
-- track down to 50, which defeats the raise.
--
-- Eviction rules are unchanged from 013: over the cap, the oldest attempt by
-- created_at in that track is deleted whatever its state, and the row just
-- inserted is never evicted.
--
-- Replaces the body only. trg_enforce_attempt_limit (003) keeps firing, and the
-- REVOKE in 016 still applies because CREATE OR REPLACE keeps the existing
-- privileges.
--
-- Mirrored by TRACK_ATTEMPT_CAP in api/_lib/services/attemptService.ts.
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_attempt_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  c_per_track CONSTANT INTEGER := 150;
  v_track_id  UUID;
  v_oldest_id UUID;
BEGIN
  SELECT x.track_id
    INTO v_track_id
    FROM public.exams x
   WHERE x.id = NEW.exam_id;

  WHILE (
    SELECT count(*)
      FROM public.exam_attempts a
      JOIN public.exams x ON x.id = a.exam_id
     WHERE a.user_id = NEW.user_id
       AND x.track_id = v_track_id
  ) > c_per_track LOOP
    SELECT a.id
      INTO v_oldest_id
      FROM public.exam_attempts a
      JOIN public.exams x ON x.id = a.exam_id
     WHERE a.user_id = NEW.user_id
       AND x.track_id = v_track_id
       AND a.id <> NEW.id
     ORDER BY a.created_at ASC
     LIMIT 1;

    EXIT WHEN v_oldest_id IS NULL;
    DELETE FROM public.exam_attempts WHERE id = v_oldest_id;
  END LOOP;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;
