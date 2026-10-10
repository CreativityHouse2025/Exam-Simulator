-- =============================================================================
-- 022 — Exam and tag archiving.
--
-- An archived exam can no longer be started. It stays in history and review,
-- and an unfinished attempt on it can still be saved and submitted.
-- An archived tag is hidden from students' catalog. It does not block starting
-- its exams: only the exam's own archived_at does.
-- =============================================================================

BEGIN;

-- 1. NULL means active; clearing it reopens the exam or tag.
ALTER TABLE public.exams ADD COLUMN archived_at TIMESTAMPTZ;
ALTER TABLE public.tags  ADD COLUMN archived_at TIMESTAMPTZ;

-- Every existing exam is retired; new content arrives in later migrations.
UPDATE public.exams SET archived_at = now();
UPDATE public.tags  SET archived_at = now() WHERE code = 'legacy';


-- 2. start_attempt refuses an archived exam. Signature and return type are
--    unchanged, so CREATE OR REPLACE keeps the grants from 020.
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
  INSERT INTO public.exam_attempts (
    user_id, exam_id, exam_state, time_remaining, config_snapshot, question_ids_snapshot
  )
  VALUES (
    p_user_id, p_exam_id, 'in-progress', v_duration * 60, v_config, v_questions
  )
  RETURNING exam_attempts.id INTO v_new_id;

  RETURN QUERY
    SELECT 'ok'::TEXT, a.id, a.exam_id, a.exam_state, a.current_index,
           a.time_remaining, a.created_at, a.config_snapshot,
           a.question_ids_snapshot
      FROM public.exam_attempts a
     WHERE a.id = v_new_id;
END;
$$;

COMMIT;
