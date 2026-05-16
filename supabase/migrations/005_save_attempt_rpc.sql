-- =============================================================================
-- Migration 005: save_attempt RPC
--
-- Collapses the saveAttempt service's three PostgREST round-trips into a single
-- atomic Postgres function:
--   1. UPDATE exam_attempts (ownership + TOCTOU guard, conditional completion fields)
--   2. Bulk UPDATE exam_attempt_questions (selected_choices + is_bookmarked only)
--
-- Answer rows are always pre-existing (created by insert_attempt / migration 004).
-- Only the two mutable columns are written. A row-count mismatch between the
-- supplied answers array and the rows actually updated raises an exception,
-- rolling back the entire function so nothing is persisted on a malformed payload.
--
-- Parameters:
--   p_user_id        — authenticated user (ownership check)
--   p_attempt_id     — target attempt
--   p_current_index  — current question index to persist
--   p_time_remaining — time remaining in seconds
--   p_exam_state     — 'in-progress' | 'completed'
--   p_review_state   — 'summary' | 'question'
--   p_score          — final score (pass to NULL when in-progress)
--   p_status         — 'pass' | 'fail'  (pass NULL when in-progress)
--   p_answers        — array of { question_index, selected_choices, is_bookmarked }
--
-- Returns: 'ok' | 'not_found' | 'forbidden' | 'conflict'
-- =============================================================================

CREATE OR REPLACE FUNCTION public.save_attempt(
  p_user_id        UUID,
  p_attempt_id     UUID,
  p_current_index  INTEGER,
  p_time_remaining INTEGER,
  p_exam_state     TEXT,
  p_review_state   TEXT,
  p_score          NUMERIC,
  p_status         TEXT,
  p_answers        JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_updated_id  UUID;
  v_owner       UUID;
  v_state       TEXT;
  v_updated     INTEGER;
BEGIN
  -- -------------------------------------------------------------------------
  -- Step 1: Update exam_attempts, guarded by ownership + state check.
  --
  -- score, status, and email_report_state are only written on completion;
  -- CASE expressions leave them untouched for in-progress saves.
  -- -------------------------------------------------------------------------
  UPDATE public.exam_attempts
  SET
    current_index      = p_current_index::SMALLINT,
    time_remaining     = p_time_remaining,
    exam_state         = p_exam_state,
    review_state       = p_review_state,
    score              = CASE WHEN p_exam_state = 'completed' THEN p_score              ELSE score              END,
    status             = CASE WHEN p_exam_state = 'completed' THEN p_status             ELSE status             END,
    email_report_state = CASE WHEN p_exam_state = 'completed' THEN 'pending'::TEXT      ELSE email_report_state END
  WHERE id        = p_attempt_id
    AND user_id   = p_user_id
    AND exam_state = 'in-progress'
  RETURNING id INTO v_updated_id;

  -- -------------------------------------------------------------------------
  -- If the UPDATE matched nothing, diagnose: not found / forbidden / conflict.
  -- -------------------------------------------------------------------------
  IF v_updated_id IS NULL THEN
    SELECT user_id, exam_state
      INTO v_owner, v_state
      FROM public.exam_attempts
     WHERE id = p_attempt_id;

    IF NOT FOUND THEN
      RETURN 'not_found';
    END IF;

    IF v_owner <> p_user_id THEN
      RETURN 'forbidden';
    END IF;

    -- Row exists, owned by the user, but exam_state <> 'in-progress'
    RETURN 'conflict';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 2: Bulk update the mutable answer columns.
  --
  -- Only selected_choices and is_bookmarked change during a session;
  -- question_id and choices_order are immutable after insert_attempt.
  -- A row-count mismatch means the payload references non-existent indices —
  -- raise an exception to roll back everything including step 1.
  -- -------------------------------------------------------------------------
  IF jsonb_array_length(p_answers) > 0 THEN
    UPDATE public.exam_attempt_questions q
    SET
      selected_choices = a.selected_choices,
      is_bookmarked    = a.is_bookmarked
    FROM (
      SELECT
        (e->>'question_index')::SMALLINT AS question_index,
        ARRAY(
          SELECT x::SMALLINT
          FROM jsonb_array_elements_text(e->'selected_choices') AS x
        ) AS selected_choices,
        (e->>'is_bookmarked')::BOOLEAN AS is_bookmarked
      FROM jsonb_array_elements(p_answers) AS e
    ) AS a
    WHERE q.attempt_id    = p_attempt_id
      AND q.question_index = a.question_index;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    IF v_updated <> jsonb_array_length(p_answers) THEN
      RAISE EXCEPTION
        'save_attempt: answer row mismatch — updated % of % rows for attempt %',
        v_updated, jsonb_array_length(p_answers), p_attempt_id;
    END IF;
  END IF;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB) TO service_role;
