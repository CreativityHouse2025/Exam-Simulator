-- =============================================================================
-- Migration 021: submit_attempt stores its result instead of returning it
--
-- Backend/frontend contract change: the client no longer reads a grade off
-- POST /submit's response. It calls submit (writer), then GET /attempts/:id
-- (reader) — the same read every resume already uses. That GET is the only
-- place a completed attempt's score, status and wrong_questions are read from,
-- for every caller (the student's own summary, their history list, a
-- supervisor's view of a student's attempts). Revision is the one exception:
-- it is never persisted, so it keeps grading client-side from disclosed
-- content (utils/results.ts computeLocalResult).
--
-- submit_attempt's signature is unchanged; only its RETURNS shape shrinks to
-- a sentinel, matching save_attempt. The return type is changing, which
-- Postgres does not allow via CREATE OR REPLACE — the function is dropped and
-- recreated, same as 017 did for insert_attempt/save_attempt.
-- =============================================================================

DROP FUNCTION IF EXISTS public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB);

CREATE OR REPLACE FUNCTION public.submit_attempt(
  p_user_id        UUID,
  p_attempt_id     UUID,
  p_current_index  INTEGER,
  p_time_remaining INTEGER,
  p_answers        JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner        UUID;
  v_state        TEXT;
  v_snapshot     INTEGER[];
  v_passing_rate NUMERIC;
  v_diff         TEXT;
  v_correct      INTEGER;
  v_score        NUMERIC;
  v_status       TEXT;
BEGIN
  SELECT a.user_id,
         a.exam_state,
         a.question_ids_snapshot,
         (a.config_snapshot->>'passing_rate')::NUMERIC
    INTO v_owner, v_state, v_snapshot, v_passing_rate
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

  v_diff := public.apply_answer_diff(p_attempt_id, p_answers);
  IF v_diff <> 'ok' THEN
    RETURN v_diff;
  END IF;

  -- Grading reads the STORED rows, never the request, and the rule itself lives
  -- in attempt_correct_question_ids so the revision set cannot drift from it.
  v_correct := cardinality(public.attempt_correct_question_ids(p_attempt_id));

  v_score  := round(100.0 * v_correct / cardinality(v_snapshot), 2);
  v_status := CASE WHEN v_score >= v_passing_rate THEN 'pass' ELSE 'fail' END;

  UPDATE public.exam_attempts a
     SET current_index   = p_current_index::SMALLINT,
         time_remaining  = p_time_remaining,
         exam_state      = 'completed',
         score           = v_score,
         status          = v_status,
         wrong_questions = (cardinality(v_snapshot) - v_correct)::SMALLINT
   WHERE a.id = p_attempt_id;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB) TO service_role;
