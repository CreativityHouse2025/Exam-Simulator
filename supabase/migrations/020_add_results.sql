-- =============================================================================
-- 020 — A completed attempt's grade moves to its own `results` row.
--
-- `exam_attempts.exam_state` is the source of truth for completion; the results
-- row is the payload. submit_attempt flips the state and inserts the row in one
-- transaction.
-- =============================================================================

BEGIN;

-- 1. The results table.
CREATE TABLE public.results (
  attempt_id      UUID          PRIMARY KEY,
  status          TEXT          NOT NULL,
  -- 0.00 to 100.00
  score           NUMERIC(5, 2) NOT NULL,
  -- Wrong OR unanswered.
  wrong_questions SMALLINT      NOT NULL,
  -- Seconds. NULL means the exam is untimed.
  time_taken      INTEGER,
  completed_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),

  CONSTRAINT chk_results_status          CHECK (status IN ('pass', 'fail')),
  CONSTRAINT chk_results_score           CHECK (score BETWEEN 0 AND 100),
  CONSTRAINT chk_results_wrong_questions CHECK (wrong_questions >= 0),
  CONSTRAINT chk_results_time_taken      CHECK (time_taken >= 0),

  CONSTRAINT fk_results_attempt FOREIGN KEY (attempt_id)
    REFERENCES public.exam_attempts (id) ON DELETE CASCADE
);

-- Same privileges as every other table (016): RLS on, no policies, read-only service_role.
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.results FROM anon, authenticated;
GRANT SELECT ON public.results TO service_role;


-- 2. Backfill one row per completed attempt.
--    wrong_questions is recomputed: older attempts may hold NULL.
--    time_taken clamps time_remaining to the duration, the same rule save_attempt applies.
--    updated_at is the closest record of when the attempt was submitted.
INSERT INTO public.results (attempt_id, status, score, wrong_questions, time_taken, completed_at)
SELECT a.id,
       a.status,
       a.score,
       (cardinality(a.question_ids_snapshot)
         - cardinality(public.attempt_correct_question_ids(a.id)))::SMALLINT,
       d.duration_seconds - LEAST(a.time_remaining, d.duration_seconds),
       a.updated_at
  FROM public.exam_attempts a
  CROSS JOIN LATERAL (
    SELECT (a.config_snapshot->>'exam_duration_minutes')::INTEGER * 60 AS duration_seconds
  ) d
 WHERE a.exam_state = 'completed';


-- 3. The grade leaves the attempt row.
ALTER TABLE public.exam_attempts
  DROP COLUMN status,
  DROP COLUMN score,
  DROP COLUMN wrong_questions;


-- 4. start_attempt no longer returns status and score. The return type changes,
--    so it is dropped and recreated, and its grants restated.
DROP FUNCTION public.start_attempt(UUID, SMALLINT);

CREATE FUNCTION public.start_attempt(
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
  v_config    JSONB;
  v_questions INTEGER[];
  v_duration  INTEGER;
  v_new_id    UUID;
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
         c.exam_duration_minutes
    INTO v_config, v_duration
    FROM public.exams x
    JOIN public.exam_config c ON c.id = x.config_id
   WHERE x.id = p_exam_id;

  IF v_config IS NULL THEN
    RETURN QUERY
      SELECT 'not_found'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::SMALLINT,
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

REVOKE ALL ON FUNCTION public.start_attempt(UUID, SMALLINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.start_attempt(UUID, SMALLINT) TO service_role;


-- 5. submit_attempt writes the grade to results. Signature and return type are
--    unchanged, so CREATE OR REPLACE keeps the grants from 014/016.
--    Returns 'ok' | 'not_found' | 'forbidden' | 'conflict' | 'invalid_question'
--    | 'invalid_time'. Only 'ok' writes.
CREATE OR REPLACE FUNCTION public.submit_attempt(
  p_user_id        UUID,
  p_attempt_id     UUID,
  p_current_index  INTEGER,
  p_time_remaining INTEGER DEFAULT NULL,
  p_answers        JSONB DEFAULT '[]'::jsonb
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner            UUID;
  v_state            TEXT;
  v_snapshot         INTEGER[];
  v_passing_rate     NUMERIC;
  v_duration_seconds INTEGER;
  v_time_remaining   INTEGER;
  v_diff             TEXT;
  v_correct          INTEGER;
  v_score            NUMERIC;
BEGIN
  SELECT a.user_id,
         a.exam_state,
         a.question_ids_snapshot,
         (a.config_snapshot->>'passing_rate')::NUMERIC,
         (a.config_snapshot->>'exam_duration_minutes')::INTEGER * 60
    INTO v_owner, v_state, v_snapshot, v_passing_rate, v_duration_seconds
    FROM public.exam_attempts a
   WHERE a.id = p_attempt_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF v_owner <> p_user_id THEN
    RETURN 'forbidden';
  END IF;
  IF v_state <> 'in-progress' THEN
    RETURN 'conflict';
  END IF;

  -- The payload's clock must agree with the snapshot: NULL exactly when untimed.
  IF (v_duration_seconds IS NULL) <> (p_time_remaining IS NULL) THEN
    RETURN 'invalid_time';
  END IF;

  v_diff := public.apply_answer_diff(p_attempt_id, p_answers);
  IF v_diff <> 'ok' THEN
    RETURN v_diff;
  END IF;

  v_correct        := cardinality(public.attempt_correct_question_ids(p_attempt_id));
  v_score          := round(100.0 * v_correct / cardinality(v_snapshot), 2);
  v_time_remaining := LEAST(p_time_remaining, v_duration_seconds);

  UPDATE public.exam_attempts a
     SET current_index  = p_current_index::SMALLINT,
         time_remaining = v_time_remaining,
         exam_state     = 'completed'
   WHERE a.id = p_attempt_id;

  INSERT INTO public.results (attempt_id, status, score, wrong_questions, time_taken)
  VALUES (
    p_attempt_id,
    CASE WHEN v_score >= v_passing_rate THEN 'pass' ELSE 'fail' END,
    v_score,
    (cardinality(v_snapshot) - v_correct)::SMALLINT,
    v_duration_seconds - v_time_remaining
  );

  RETURN 'ok';
END;
$$;

COMMIT;
