-- =============================================================================
-- Migration 004: insert_attempt RPC
--
-- Atomically inserts an exam_attempts row and all its exam_attempt_questions
-- rows in a single statement. Replaces the two-round-trip pattern in the
-- service layer that left orphaned attempt rows on partial failure.
--
-- Parameters:
--   p_user_id       — authenticated user
--   p_exam_type     — 'full' | 'domain'
--   p_exam_id       — required when exam_type = 'full', otherwise NULL
--   p_category_id   — required when exam_type = 'domain', otherwise NULL
--   p_time_remaining — initial time in seconds (duration_minutes * 60)
--   p_questions     — ordered array of { question_id: int, choices_order: int[] }
--
-- Returns: the new attempt UUID
-- =============================================================================

CREATE OR REPLACE FUNCTION public.insert_attempt(
  p_user_id        UUID,
  p_exam_type      TEXT,
  p_exam_id        INTEGER,
  p_category_id    INTEGER,
  p_time_remaining INTEGER,
  p_questions      JSONB
)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  WITH new_attempt AS (
    INSERT INTO public.exam_attempts (user_id, exam_type, exam_id, category_id, time_remaining)
    VALUES (p_user_id, p_exam_type, p_exam_id, p_category_id, p_time_remaining)
    RETURNING id
  ),
  _questions AS (
    INSERT INTO public.exam_attempt_questions (attempt_id, question_index, question_id, choices_order)
    SELECT
      new_attempt.id,
      (ord - 1)::SMALLINT,
      (q->>'question_id')::INTEGER,
      ARRAY(SELECT elem::SMALLINT FROM jsonb_array_elements_text(q->'choices_order') AS elem)
    FROM new_attempt, jsonb_array_elements(p_questions) WITH ORDINALITY AS t(q, ord)
  )
  SELECT id FROM new_attempt;
$$;

REVOKE EXECUTE ON FUNCTION public.insert_attempt(UUID, TEXT, INTEGER, INTEGER, INTEGER, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.insert_attempt(UUID, TEXT, INTEGER, INTEGER, INTEGER, JSONB) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_attempt(UUID, TEXT, INTEGER, INTEGER, INTEGER, JSONB) TO service_role;
