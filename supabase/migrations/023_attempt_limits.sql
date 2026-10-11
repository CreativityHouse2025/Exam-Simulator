-- =============================================================================
-- 023 — Attempt limits.
--
-- A student has at most one unfinished attempt per exam. Starting again
-- returns the open attempt instead of creating a second one.
--
-- Attempts are otherwise unlimited: the per-track cap trigger is dropped, and
-- nothing deletes an attempt automatically.
-- =============================================================================

BEGIN;

-- 1. Legacy duplicates: every open attempt but the newest per (user, exam) is
--    submitted as it stands, through submit_attempt itself, so it is graded
--    exactly as a student's own submit would be.
DO $$
DECLARE
  v_attempt RECORD;
  v_result  TEXT;
BEGIN
  FOR v_attempt IN
    SELECT d.id, d.user_id, d.current_index, d.time_remaining
      FROM (
        SELECT a.id, a.user_id, a.current_index, a.time_remaining,
               row_number() OVER (
                 PARTITION BY a.user_id, a.exam_id
                 ORDER BY a.created_at DESC, a.id DESC
               ) AS recency
          FROM public.exam_attempts a
         WHERE a.exam_state = 'in-progress'
      ) d
     WHERE d.recency > 1
  LOOP
    v_result := public.submit_attempt(
      v_attempt.user_id, v_attempt.id, v_attempt.current_index, v_attempt.time_remaining
    );

    IF v_result <> 'ok' THEN
      RAISE EXCEPTION '023: auto-submit of attempt % returned %', v_attempt.id, v_result;
    END IF;
  END LOOP;
END $$;


-- 2. Race backstop for start_attempt's check.
CREATE UNIQUE INDEX exam_attempts_one_open_per_exam
  ON public.exam_attempts (user_id, exam_id)
  WHERE exam_state = 'in-progress';


-- 3. start_attempt returns `in_progress` with the open attempt's id instead of
--    inserting. Signature and return type are unchanged, so CREATE OR REPLACE
--    keeps the grants from 020.
CREATE OR REPLACE FUNCTION public.start_attempt(
  p_user_id UUID,
  p_exam_id SMALLINT
)
RETURNS TABLE (
  result                TEXT,
  id                    UUID,
  exam_id               SMALLINT,
  exam_state            TEXT,
  current_index         SMALLINT,
  time_remaining        INTEGER,
  created_at            TIMESTAMPTZ,
  config_snapshot       JSONB,
  question_ids_snapshot INTEGER[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_config      JSONB;
  v_questions   INTEGER[];
  v_duration    INTEGER;
  v_archived_at TIMESTAMPTZ;
  v_open_id     UUID;
  v_new_id      UUID;
BEGIN
  SELECT jsonb_build_object(
           'exam_duration_minutes', c.exam_duration_minutes,
           'passing_rate',          c.passing_rate,
           'can_reveal_answers',    c.can_reveal_answers,
           'allow_retry_wrong',     c.allow_retry_wrong,
           'breaks', COALESCE(
             (SELECT jsonb_agg(
                       jsonb_build_object(
                         'show_at_index',    b.show_at_index,
                         'duration_minutes', b.duration_minutes
                       )
                       ORDER BY b.show_at_index
                     )
                FROM public.breaks b
               WHERE b.config_id = c.id),
             '[]'::jsonb
           )
         ),
         c.exam_duration_minutes,
         x.archived_at
    INTO v_config, v_duration, v_archived_at
    FROM public.exams x
    JOIN public.exam_config c ON c.id = x.config_id
   WHERE x.id = p_exam_id;

  IF v_config IS NULL THEN
    RETURN QUERY
      SELECT 'not_found'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
             NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  SELECT a.id
    INTO v_open_id
    FROM public.exam_attempts a
   WHERE a.user_id = p_user_id
     AND a.exam_id = p_exam_id
     AND a.exam_state = 'in-progress';

  IF v_open_id IS NOT NULL THEN
    RETURN QUERY
      SELECT 'in_progress'::TEXT, v_open_id, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
             NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  IF v_archived_at IS NOT NULL THEN
    RETURN QUERY
      SELECT 'archived'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
             NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  SELECT array_agg(q.question_id ORDER BY q.question_index)
    INTO v_questions
    FROM public.exam_questions q
   WHERE q.exam_id = p_exam_id;

  IF v_questions IS NULL OR cardinality(v_questions) = 0 THEN
    RETURN QUERY
      SELECT 'not_found'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
             NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  -- v_duration is NULL for an untimed exam, so the clock is NULL rather than 0.
  BEGIN
    INSERT INTO public.exam_attempts (
      user_id, exam_id, exam_state, time_remaining, config_snapshot, question_ids_snapshot
    )
    VALUES (
      p_user_id, p_exam_id, 'in-progress', v_duration * 60, v_config, v_questions
    )
    RETURNING exam_attempts.id INTO v_new_id;
  EXCEPTION WHEN unique_violation THEN
    -- A concurrent start won the race; hand back its attempt.
    SELECT a.id
      INTO v_open_id
      FROM public.exam_attempts a
     WHERE a.user_id = p_user_id
       AND a.exam_id = p_exam_id
       AND a.exam_state = 'in-progress';

    RETURN QUERY
      SELECT 'in_progress'::TEXT, v_open_id, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
             NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END;

  RETURN QUERY
    SELECT 'ok'::TEXT, a.id, a.exam_id, a.exam_state, a.current_index,
           a.time_remaining, a.created_at, a.config_snapshot,
           a.question_ids_snapshot
      FROM public.exam_attempts a
     WHERE a.id = v_new_id;
END;
$$;


-- 4. Unlimited attempts: the per-track cap (003, last set by 018) goes.
DROP TRIGGER trg_enforce_attempt_limit ON public.exam_attempts;
DROP FUNCTION public.enforce_attempt_limit();

COMMIT;
