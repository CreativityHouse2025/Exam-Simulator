-- =============================================================================
-- Migration 014: the attempt write and read path
--
-- Replaces insert_attempt and save_attempt, both of which reference columns and
-- a table name that 013 removed and raise at call time.
--
--   start_attempt      the client sends { exam_id }; the server decides the
--                      question set, the order, the config and the clock
--   save_attempt       in-progress only, applies an answer DIFF, NEVER grades
--   submit_attempt     applies the final diff, then grades it and STORES the
--                      result; returns a sentinel, not a grade
--   apply_answer_diff  internal, shared by both writers so the diff rule exists
--                      in exactly one place
--   attempt_correct_question_ids
--                      internal, the grading predicate, so "did this student
--                      answer this question exactly right" exists in exactly
--                      one place too
--   revision_question_ids
--                      the "wrong or unanswered" set, the complement of the
--                      predicate above
--
-- insert_attempt is renamed to start_attempt: it no longer inserts what it is
-- told to, it starts an exam.
--
-- Consolidates three migrations that were unapplied everywhere. The saving is
-- real rather than cosmetic: old 017 created a submit_attempt returning
-- TABLE(result, score, status, wrong_questions, total_questions), and old 021
-- dropped and recreated it returning TEXT four days later. Only the final body
-- is written here — the interim one never exists, so nothing has to be dropped
-- to replace it.
--
-- Track access is NOT checked in any of these. It is enforced in the service
-- layer through assertTrackAccess, which needs the caller's role, and a definer
-- function cannot see it.
-- =============================================================================

DROP FUNCTION IF EXISTS public.insert_attempt(UUID, TEXT, INTEGER, INTEGER, INTEGER, JSONB);
DROP FUNCTION IF EXISTS public.save_attempt(UUID, UUID, INTEGER, INTEGER, TEXT, TEXT, NUMERIC, TEXT, JSONB, TIMESTAMPTZ, TIMESTAMPTZ);

-- Only for a developer machine that replayed the superseded 017 before this
-- consolidation: its submit_attempt has the same argument types but a different
-- return type, which CREATE OR REPLACE cannot change. Production never had it.
DROP FUNCTION IF EXISTS public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB);


-- ---------------------------------------------------------------------------
-- apply_answer_diff — the answers array is a DIFF, not a complete set
--
-- Per entry:
--   selected_choices non-empty OR is_bookmarked  -> upsert the row
--   selected_choices empty AND not bookmarked    -> delete the row if present
--
-- Rows not mentioned are untouched. There is no blanket delete of absent rows:
-- emptiness is a delete instruction, not invalid input.
--
-- Every question_id must be a member of the attempt's question_ids_snapshot,
-- and every selected position must be a choice that question actually has.
-- Both violations return 'invalid_question' rather than raising, so the handler
-- can answer 400 instead of 500.
--
-- Duplicate question_ids in one payload are rejected by the request schema
-- (shared/schemas/attempt.schema.ts); here they would make ON CONFLICT DO
-- UPDATE raise "cannot affect row a second time".
--
-- Internal: granted to nobody. Its callers are SECURITY DEFINER functions
-- owned by the same role, which is what lets them call it.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.apply_answer_diff(
  p_attempt_id UUID,
  p_answers    JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_snapshot INTEGER[];
  v_unknown  INTEGER;
BEGIN
  IF p_answers IS NULL OR jsonb_array_length(p_answers) = 0 THEN
    RETURN 'ok';
  END IF;

  SELECT question_ids_snapshot
    INTO v_snapshot
    FROM public.exam_attempts
   WHERE id = p_attempt_id;

  SELECT count(*)
    INTO v_unknown
    FROM jsonb_array_elements(p_answers) AS e
   WHERE NOT ((e->>'question_id')::INTEGER = ANY (v_snapshot));

  IF v_unknown > 0 THEN
    RETURN 'invalid_question';
  END IF;

  SELECT count(*)
    INTO v_unknown
    FROM jsonb_array_elements(p_answers) AS e
    CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(e->'selected_choices', '[]'::jsonb)) AS pos
   WHERE NOT EXISTS (
           SELECT 1
             FROM public.choices c
            WHERE c.question_id = (e->>'question_id')::INTEGER
              AND c.position    = pos::SMALLINT
         );

  IF v_unknown > 0 THEN
    RETURN 'invalid_question';
  END IF;

  WITH incoming AS (
    SELECT
      (e->>'question_id')::INTEGER AS question_id,
      COALESCE(
        ARRAY(SELECT x::SMALLINT FROM jsonb_array_elements_text(e->'selected_choices') AS x),
        '{}'::SMALLINT[]
      ) AS selected_choices,
      COALESCE((e->>'is_bookmarked')::BOOLEAN, false) AS is_bookmarked
    FROM jsonb_array_elements(p_answers) AS e
  ),
  -- An entry that is neither answered nor bookmarked means "forget this row".
  cleared AS (
    DELETE FROM public.attempt_answers r
     USING incoming i
     WHERE r.attempt_id  = p_attempt_id
       AND r.question_id = i.question_id
       AND cardinality(i.selected_choices) = 0
       AND NOT i.is_bookmarked
    RETURNING r.question_id
  )
  INSERT INTO public.attempt_answers (attempt_id, question_id, selected_choices, is_bookmarked)
  SELECT p_attempt_id, i.question_id, i.selected_choices, i.is_bookmarked
    FROM incoming i
   WHERE cardinality(i.selected_choices) > 0 OR i.is_bookmarked
      ON CONFLICT (attempt_id, question_id) DO UPDATE
     SET selected_choices = EXCLUDED.selected_choices,
         is_bookmarked    = EXCLUDED.is_bookmarked;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.apply_answer_diff(UUID, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.apply_answer_diff(UUID, JSONB) FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- attempt_correct_question_ids — the grading predicate, in one place
--
-- A question is correct when the set of positions the student stored equals
-- the set of positions flagged is_correct. A question with no attempt_answers
-- row is wrong by absence (sparse storage) and is dropped by the join, so it
-- never appears here.
--
-- Returns the ids in ascending order. Callers that need the attempt's own
-- order do their own ordering against question_ids_snapshot — this is a set,
-- not a sequence.
--
-- submit_attempt counts these to grade; revision_question_ids takes the
-- complement to build the "wrong or unanswered" set. Neither restates the rule.
--
-- Reads the CURRENT choices rows. An attempt graded before a question's answer
-- key was edited will therefore disagree with a revision generated after it.
-- Pre-existing behaviour; freezing the key into the attempt is a separate call.
--
-- Internal: granted to nobody.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attempt_correct_question_ids(p_attempt_id UUID)
RETURNS INTEGER[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT COALESCE(array_agg(s.question_id ORDER BY s.question_id), '{}'::INTEGER[])
    FROM public.exam_attempts a
    CROSS JOIN LATERAL unnest(a.question_ids_snapshot) AS s(question_id)
    JOIN public.attempt_answers r
      ON r.attempt_id  = a.id
     AND r.question_id = s.question_id
   WHERE a.id = p_attempt_id
     AND (
           SELECT array_agg(DISTINCT c.position ORDER BY c.position)
             FROM public.choices c
            WHERE c.question_id = s.question_id
              AND c.is_correct
         )
         =
         (
           SELECT array_agg(DISTINCT x ORDER BY x)
             FROM unnest(r.selected_choices) AS x
         );
$$;

REVOKE EXECUTE ON FUNCTION public.attempt_correct_question_ids(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.attempt_correct_question_ids(UUID) FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- start_attempt
--
-- The client sends an exam id and nothing else. This function:
--   1. snapshots the exam's config from exam_config + breaks
--   2. snapshots the exam's question ids, ordered by question_index
--   3. derives the clock from the snapshot (untimed -> NULL, never 0)
--   4. inserts the attempt; no attempt_answers rows are pre-seeded, because an
--      untouched question has no row
--
-- Every call creates an attempt. There is no duplicate-start guard here: not
-- sending the request twice is the frontend's job, and several unfinished
-- attempts for one exam are a legitimate state anyway, bounded by the caps in
-- 013. Nothing is ever deleted here.
--
-- `result` is 'ok' | 'not_found' (sentinels, never raises). 'not_found' covers
-- an exam id with no exams row and an exam with no exam_questions rows; every
-- other column is NULL on that row. Only 'ok' writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_attempt(
  p_user_id UUID,
  p_exam_id SMALLINT
)
RETURNS TABLE (
  result                TEXT,
  id                    UUID,
  exam_id               SMALLINT,
  exam_state            TEXT,
  status                TEXT,
  score                 NUMERIC,
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
      SELECT 'not_found'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC,
             NULL::SMALLINT, NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  SELECT array_agg(q.question_id ORDER BY q.question_index)
    INTO v_questions
    FROM public.exam_questions q
   WHERE q.exam_id = p_exam_id;

  -- An exam with no questions cannot be started. 012 refuses to produce one,
  -- so this is the same "nothing to start" answer as a missing exam.
  IF v_questions IS NULL OR cardinality(v_questions) = 0 THEN
    RETURN QUERY
      SELECT 'not_found'::TEXT, NULL::UUID, NULL::SMALLINT, NULL::TEXT, NULL::TEXT, NULL::NUMERIC,
             NULL::SMALLINT, NULL::INTEGER, NULL::TIMESTAMPTZ, NULL::JSONB, NULL::INTEGER[];
    RETURN;
  END IF;

  -- v_duration is NULL for an untimed exam, so the clock is NULL rather than 0.
  -- 013 made time_remaining nullable for exactly this.
  INSERT INTO public.exam_attempts (
    user_id, exam_id, exam_state, time_remaining, config_snapshot, question_ids_snapshot
  )
  VALUES (
    p_user_id, p_exam_id, 'in-progress', v_duration * 60, v_config, v_questions
  )
  RETURNING exam_attempts.id INTO v_new_id;

  RETURN QUERY
    SELECT 'ok'::TEXT, a.id, a.exam_id, a.exam_state, a.status, a.score, a.current_index,
           a.time_remaining, a.created_at, a.config_snapshot,
           a.question_ids_snapshot
      FROM public.exam_attempts a
     WHERE a.id = v_new_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.start_attempt(UUID, SMALLINT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.start_attempt(UUID, SMALLINT) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.start_attempt(UUID, SMALLINT) TO service_role;


-- ---------------------------------------------------------------------------
-- save_attempt
--
-- In-progress state only. It cannot complete an attempt and it never computes a
-- score — that is submit_attempt's job behind its own endpoint.
--
-- p_offered_breaks: an array of break indices, e.g. [60, 120]. Break offers have
-- had no write path since 013 created offered_breaks; this is it. ON CONFLICT DO
-- NOTHING preserves the first timestamp recorded for a break, matching the
-- COALESCE behaviour the dropped break_*_offered_at columns had.
--
-- offered_at is stamped with now() by the server, never sent by the client. The
-- client's clock is not evidence of when anything happened, and the frontend
-- only ever needs to know WHETHER a break was offered.
--
-- show_at_index is NOT validated against config_snapshot->'breaks' (reviewed and
-- accepted): ownership and state are enforced above, the primary key bounds it
-- to one row per index, and the only thing a student can corrupt is their own
-- break record.
--
-- p_time_remaining is NULL exactly when the attempt is untimed, and 'invalid_time' says it was
-- not: seconds on an attempt that has no clock, or no clock on an attempt that has one. A timed
-- value is clamped to the snapshot's own duration — the client owns the clock but cannot report
-- more of it than the exam ever had.
--
-- Returns 'ok' | 'not_found' | 'forbidden' | 'conflict' | 'invalid_question' | 'invalid_time'.
-- Every one of those leaves the attempt untouched; only 'ok' writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_attempt(
  p_user_id        UUID,
  p_attempt_id     UUID,
  p_current_index  INTEGER,
  -- Omitted by an untimed attempt, which has no clock to report. A default here forces one on
  -- every parameter after it, which costs nothing: an empty diff is already a valid save.
  p_time_remaining INTEGER DEFAULT NULL,
  p_answers        JSONB DEFAULT '[]'::jsonb,
  p_offered_breaks JSONB DEFAULT '[]'::jsonb
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_owner            TEXT;
  v_state            TEXT;
  v_duration_seconds INTEGER;
  v_diff             TEXT;
BEGIN
  -- Access and state are resolved first, and the answer diff is validated
  -- before anything is written, so every failure leaves the attempt exactly as
  -- it was and comes back as a sentinel the handler maps to a status code.
  SELECT a.user_id::TEXT,
         a.exam_state,
         (a.config_snapshot->>'exam_duration_minutes')::INTEGER * 60
    INTO v_owner, v_state, v_duration_seconds
    FROM public.exam_attempts a
   WHERE a.id = p_attempt_id
     FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;
  IF v_owner <> p_user_id::TEXT THEN
    RETURN 'forbidden';
  END IF;
  IF v_state <> 'in-progress' THEN
    RETURN 'conflict';
  END IF;

  -- The clock in the payload must agree with the attempt's own snapshot: an untimed attempt has
  -- no seconds to report, and a timed one cannot report "no clock" without erasing a real one.
  IF (v_duration_seconds IS NULL) <> (p_time_remaining IS NULL) THEN
    RETURN 'invalid_time';
  END IF;

  -- apply_answer_diff validates the whole payload before its first write, so a
  -- rejected diff has changed nothing here.
  v_diff := public.apply_answer_diff(p_attempt_id, p_answers);
  IF v_diff <> 'ok' THEN
    RETURN v_diff;
  END IF;

  -- Clamped to the attempt's own duration: the clock is the client's to report but not to invent,
  -- and a value above the exam's length is the one thing it can never legitimately be. LEAST
  -- ignores a NULL argument rather than propagating it, which is only correct because the check
  -- above has already proven both are NULL together or neither is.
  UPDATE public.exam_attempts
     SET current_index  = p_current_index::SMALLINT,
         time_remaining = LEAST(p_time_remaining, v_duration_seconds)
   WHERE id = p_attempt_id;

  IF p_offered_breaks IS NOT NULL AND jsonb_array_length(p_offered_breaks) > 0 THEN
    INSERT INTO public.offered_breaks (attempt_id, show_at_index, offered_at)
    SELECT p_attempt_id, e::SMALLINT, now()
      FROM jsonb_array_elements_text(p_offered_breaks) AS e
        ON CONFLICT (attempt_id, show_at_index) DO NOTHING;
  END IF;

  RETURN 'ok';
END;
$$;

REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, JSONB, JSONB) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, JSONB, JSONB) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, JSONB, JSONB) TO service_role;


-- ---------------------------------------------------------------------------
-- submit_attempt
--
-- Applies the final answer diff and grades it in ONE transaction. The diff
-- travels with the submission for exactly that reason: split across two calls,
-- a lost request grades an attempt that is missing its last answers.
--
-- It STORES the result rather than returning it. The client does not read a
-- grade off this response — it calls submit (writer), then GET /attempts/:id
-- (reader), the same read every resume already uses. That GET is the only place
-- a completed attempt's score, status and wrong_questions are read from, for
-- every caller. Revision is the one exception: it is never persisted, so it
-- keeps grading client-side from disclosed content (utils/results.ts
-- computeLocalResult).
--
-- Grading reads the STORED rows, never the request:
--   - correctness is attempt_correct_question_ids, so the rule is not restated
--   - a question with no row is wrong by absence
--   - score is the percentage over cardinality(question_ids_snapshot)
--   - status compares that score against the attempt's OWN config_snapshot,
--     not the exam's current config, which may have changed since
--
-- Returns 'ok' | 'not_found' | 'forbidden' | 'conflict' | 'invalid_question'
-- | 'invalid_time'. Only 'ok' writes.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_attempt(
  p_user_id        UUID,
  p_attempt_id     UUID,
  p_current_index  INTEGER,
  -- Omitted by an untimed attempt — see save_attempt.
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
  v_diff             TEXT;
  v_correct          INTEGER;
  v_score            NUMERIC;
  v_status           TEXT;
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

  -- Same agreement rule save_attempt enforces: the payload's clock must match the snapshot's.
  -- It runs before the write for the same reason too — LEAST below ignores a NULL argument rather
  -- than propagating it, so the clamp is only correct once both are known to be NULL together.
  IF (v_duration_seconds IS NULL) <> (p_time_remaining IS NULL) THEN
    RETURN 'invalid_time';
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

  -- wrong_questions counts answered-wrong AND unanswered: everything in the
  -- snapshot that was not answered exactly right.
  UPDATE public.exam_attempts a
     SET current_index   = p_current_index::SMALLINT,
         time_remaining  = LEAST(p_time_remaining, v_duration_seconds),
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


-- ---------------------------------------------------------------------------
-- revision_question_ids — the "wrong or unanswered" set
--
-- Membership is the complement of attempt_correct_question_ids within
-- question_ids_snapshot, so a question the student never opened falls in by
-- absence. The result keeps the attempt's own frozen order, which is why the
-- snapshot is unnested WITH ORDINALITY rather than filtered as a set.
--
-- This replaces the service's read-attempt / read-whole-answer-key / filter-in-JS
-- sequence, which was a second, hand-rewritten copy of the grading rule that
-- submit_attempt already owned.
--
-- exam_id rides along so the service needs no separate read of the attempt to
-- find the parent exam.
--
-- Nothing is persisted: a revision is recomputed on every request, and an empty
-- array is a normal outcome rather than an error.
--
-- Returns 'ok' | 'not_found' | 'forbidden'. All three refusals the service used
-- to make — not the owner, not completed, retry not offered — collapse into
-- 'forbidden', deliberately: a revision the caller may not have is simply
-- refused, and which of the three it was is not the client's business.
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
