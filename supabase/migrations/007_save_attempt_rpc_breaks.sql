-- =============================================================================
-- Migration 007: extend save_attempt RPC with break tracking fields
--
-- Adds p_break_1_offered_at and p_break_2_offered_at parameters.
-- Passing NULL for either means "leave the existing value unchanged"
-- (COALESCE pattern). The frontend only passes a timestamp once, when it
-- first shows that break modal.
--
-- The old function signature is dropped first to avoid an orphaned overload.
-- =============================================================================

DROP FUNCTION IF EXISTS public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB);

CREATE OR REPLACE FUNCTION public.save_attempt(
  p_user_id               UUID,
  p_attempt_id            UUID,
  p_current_index         INTEGER,
  p_time_remaining        INTEGER,
  p_exam_state            TEXT,
  p_review_state          TEXT,
  p_score                 NUMERIC,
  p_status                TEXT,
  p_answers               JSONB,
  p_break_1_offered_at    TIMESTAMPTZ DEFAULT NULL,
  p_break_2_offered_at    TIMESTAMPTZ DEFAULT NULL
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
  -- score, status, and email_report_state are only written on completion.
  -- break_x_offered_at uses COALESCE with the DB value first: once a timestamp
  -- is recorded it is never overwritten, even if the frontend sends a new one.
  -- -------------------------------------------------------------------------
  UPDATE public.exam_attempts
  SET
    current_index        = p_current_index::SMALLINT,
    time_remaining       = p_time_remaining,
    exam_state           = p_exam_state,
    review_state         = p_review_state,
    score                = CASE WHEN p_exam_state = 'completed' THEN p_score         ELSE score              END,
    status               = CASE WHEN p_exam_state = 'completed' THEN p_status        ELSE status             END,
    email_report_state   = CASE WHEN p_exam_state = 'completed' THEN 'pending'::TEXT ELSE email_report_state END,
    break_1_offered_at   = COALESCE(break_1_offered_at, p_break_1_offered_at),
    break_2_offered_at   = COALESCE(break_2_offered_at, p_break_2_offered_at)
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

    RETURN 'conflict';
  END IF;

  -- -------------------------------------------------------------------------
  -- Step 2: Bulk update the mutable answer columns.
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
    WHERE q.attempt_id     = p_attempt_id
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

REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB, TIMESTAMPTZ, TIMESTAMPTZ) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
