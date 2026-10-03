-- =============================================================================
-- Migration 018: attempt totals, and the revision set as a query
--
-- Two changes, both of them removing a duplicate:
--
--   1. exam_attempts.total_questions — a stored generated column, so the
--      attempt list no longer ships question_ids_snapshot (up to 180 int4 per
--      row, 25 rows per request) purely to read its length in TypeScript.
--
--   2. revision_question_ids — the "wrong or unanswered" set, computed from
--      017's attempt_correct_question_ids. It replaces the service's
--      read-attempt / read-whole-answer-key / filter-in-JS sequence, which was
--      a second, hand-rewritten copy of the grading rule submit_attempt
--      already owned.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. exam_attempts.total_questions
--
--    cardinality() is immutable, which is what lets this be a generated column
--    rather than a trigger. chk_question_ids_snapshot_not_empty (016) already
--    guarantees it is >= 1, so it is never null and never zero.
--
--    NOT NULL is declared explicitly: a generated column is nullable by default,
--    and the type generator reads that literally. Without it every caller would
--    have to narrow a null that the source column's own NOT NULL already rules
--    out.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ADD COLUMN total_questions INTEGER NOT NULL
    GENERATED ALWAYS AS (cardinality(question_ids_snapshot)) STORED;


-- ---------------------------------------------------------------------------
-- 2. revision_question_ids — the "wrong or unanswered" set
--
-- Membership is the complement of 017's attempt_correct_question_ids within
-- question_ids_snapshot, so a question the student never opened falls in by
-- absence. The result keeps the attempt's own frozen order, which is why the
-- snapshot is unnested WITH ORDINALITY rather than filtered as a set.
--
-- exam_id rides along so the service needs no separate read of the attempt to
-- find the parent exam.
--
-- Nothing is persisted: a revision is recomputed on every request, and an
-- empty array is a normal outcome rather than an error.
--
-- Returns 'ok' | 'not_found' | 'forbidden', per 017's sentinel convention. All
-- three refusals the service used to make — not the owner, not completed,
-- retry not offered — collapse into 'forbidden', deliberately: a revision the
-- caller may not have is simply refused, and which of the three it was is not
-- the client's business.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.revision_question_ids(
  p_user_id    UUID,
  p_attempt_id UUID
)
RETURNS TABLE (
  result       TEXT,
  exam_id      SMALLINT,
  question_ids INTEGER[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner    UUID;
  v_state    TEXT;
  v_retry    BOOLEAN;
  v_exam_id  SMALLINT;
  v_snapshot INTEGER[];
  v_correct  INTEGER[];
BEGIN
  SELECT a.user_id,
         a.exam_state,
         a.exam_id,
         a.question_ids_snapshot,
         COALESCE((a.config_snapshot->>'allow_retry_wrong')::BOOLEAN, false)
    INTO v_owner, v_state, v_exam_id, v_snapshot, v_retry
    FROM public.exam_attempts a
   WHERE a.id = p_attempt_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::SMALLINT, NULL::INTEGER[];
    RETURN;
  END IF;

  IF v_owner <> p_user_id OR v_state <> 'completed' OR NOT v_retry THEN
    RETURN QUERY SELECT 'forbidden'::TEXT, NULL::SMALLINT, NULL::INTEGER[];
    RETURN;
  END IF;

  v_correct := public.attempt_correct_question_ids(p_attempt_id);

  RETURN QUERY
    SELECT 'ok'::TEXT,
           v_exam_id,
           ARRAY(
             SELECT t.question_id
               FROM unnest(v_snapshot) WITH ORDINALITY AS t(question_id, ord)
              WHERE NOT (t.question_id = ANY (v_correct))
              ORDER BY t.ord
           );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.revision_question_ids(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revision_question_ids(UUID, UUID) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.revision_question_ids(UUID, UUID) TO service_role;
