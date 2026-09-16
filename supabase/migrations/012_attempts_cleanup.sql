-- =============================================================================
-- Migration 012: exam_attempts cleanup for the multi-track schema
--
-- Implements the cleanup decisions in docs/specs/spec-add-tracks.md:
--   (1) revision attempts are never stored   -> drop parent_attempt_id
--   (2) 'full' / 'domain' are not real kinds  -> drop exam_type, category_id
--   (3) routing no longer needs review_state  -> drop review_state
--   (4) email reports are gone                -> drop email_report_state
--   (5) breaks belong to their own table      -> offered_breaks
--   (6) exam_attempt_questions -> attempt_answers, drop choices_order
--
-- Decision (11)'s break backfill runs here because it has to: the columns it
-- reads are dropped by this same migration. Decision (10)'s domain remap and
-- the insert_attempt / save_attempt rewrites are deferred to the migrations
-- that land alongside the backend change. Postgres does not track dependencies
-- into a function whose body is a string literal, so both RPCs survive this
-- migration and fail at call time. See the note at the bottom.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 0. Precondition for decision (10): domain attempts must already carry the
--    exam id of their new "exams" row. category_id is about to be dropped and
--    is the only record of which domain an attempt belonged to — refuse to run
--    rather than destroy that mapping silently.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_unmapped INTEGER;
BEGIN
  SELECT count(*)
    INTO v_unmapped
    FROM public.exam_attempts
   WHERE exam_type = 'domain'
     AND exam_id IS NULL;

  IF v_unmapped > 0 THEN
    RAISE EXCEPTION
      'Migration 012: % domain attempt(s) still have exam_id IS NULL. Run the domain remap (spec decision 10) before dropping category_id.',
      v_unmapped;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 1. offered_breaks
--    One row per break actually offered during an attempt. Replaces the two
--    fixed break_(1|2)_offered_at columns, which cannot express the N breaks
--    per config that public.breaks now allows.
-- ---------------------------------------------------------------------------
CREATE TABLE public.offered_breaks (
  attempt_id     uuid         NOT NULL REFERENCES public.exam_attempts (id) ON DELETE CASCADE,
  show_at_index  smallint     NOT NULL CHECK (show_at_index >= 0),
  offered_at     timestamptz  NOT NULL,

  PRIMARY KEY (attempt_id, show_at_index)
);


-- ---------------------------------------------------------------------------
-- 2. Backfill existing break offers (spec decision 11). Must run before the
--    columns are dropped below — they are the only record of these offers.
--    Historical break indices were hardcoded in the frontend as
--    BREAK_THRESHOLDS = { 1: 60, 2: 120 } (src/utils/progress.ts).
-- ---------------------------------------------------------------------------
INSERT INTO public.offered_breaks (attempt_id, show_at_index, offered_at)
SELECT id, 60::smallint, break_1_offered_at
  FROM public.exam_attempts
 WHERE break_1_offered_at IS NOT NULL;

INSERT INTO public.offered_breaks (attempt_id, show_at_index, offered_at)
SELECT id, 120::smallint, break_2_offered_at
  FROM public.exam_attempts
 WHERE break_2_offered_at IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 3. Drop the superseded exam_attempts columns.
--    The CHECK constraints chk_exam_type, chk_exam_type_full,
--    chk_exam_type_domain, chk_review_state, chk_email_report_state,
--    chk_break_1_full_only and chk_break_2_full_only reference these columns
--    and are dropped with them.
--
--    exam_id becomes NOT NULL in the same statement: every attempt now points
--    at an exams row, and the guard in step 0 has already proven no row is
--    left without one.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  DROP COLUMN parent_attempt_id,
  DROP COLUMN exam_type,
  DROP COLUMN category_id,
  DROP COLUMN review_state,
  DROP COLUMN email_report_state,
  DROP COLUMN break_1_offered_at,
  DROP COLUMN break_2_offered_at,
  ALTER COLUMN exam_id SET NOT NULL;


-- ---------------------------------------------------------------------------
-- 4. exam_attempt_questions -> attempt_answers (spec decision 6).
--    Choices are no longer reordered, so the stored order is dead weight.
--    Constraint and index names are renamed with the table so the schema does
--    not carry the old name in its metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempt_questions RENAME TO attempt_answers;

ALTER TABLE public.attempt_answers DROP COLUMN choices_order;

ALTER INDEX public.exam_attempt_questions_pkey RENAME TO attempt_answers_pkey;

ALTER TABLE public.attempt_answers
  RENAME CONSTRAINT exam_attempt_questions_attempt_id_fkey TO attempt_answers_attempt_id_fkey;


-- =============================================================================
-- Deferred / broken by this migration — spec decision (4) says highlight, not
-- silently fix:
--
--   public.insert_attempt  — writes exam_type, category_id and choices_order,
--                            and targets exam_attempt_questions by its old name
--   public.save_attempt    — writes review_state, email_report_state and both
--                            break_*_offered_at, and targets the old table name
--
--   Both still exist and will raise at call time until the deferred RPC
--   migration replaces them.
--
--   api/_lib/services/attemptService.ts calls both and also selects the dropped
--   columns directly:
--     :21-39   builds p_exam_type / p_category_id / choices_order
--     :74-81   passes p_review_state and both p_break_*_offered_at
--     :125     selects exam_type, category_id, exam_attempt_questions(count)
--     :163     selects review_state, email_report_state, break_*_offered_at,
--              exam_attempt_questions(..., choices_order, ...)
--
--   Break offers have no write path any more: they used to ride along on
--   save_attempt. A write to public.offered_breaks must be added with the
--   deferred RPC work.
--
--   exam_attempts.exam_id and attempt_answers.question_id still have no FK to
--   public.exams — the question banks are not in the database yet.
-- =============================================================================
