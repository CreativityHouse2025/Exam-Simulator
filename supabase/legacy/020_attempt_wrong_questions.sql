-- =============================================================================
-- Migration 020: exam_attempts.wrong_questions
--
-- score and status are already stored columns (003), set once by submit_attempt
-- and read back by every subsequent GET. wrong_questions was the one piece of a
-- graded attempt that only ever existed in submit_attempt's return row — every
-- other reader (history list, resumed/completed session, a supervisor's view of
-- a student's attempts) had no way to learn it without recomputing it
-- client-side from disclosed content. Storing it makes the backend the single
-- source of truth for a completed attempt's result, matching score and status.
--
-- NULL while in-progress, same convention as status — no cross-column CHECK
-- ties it to exam_state, matching the existing score/status columns.
-- =============================================================================

ALTER TABLE public.exam_attempts
  ADD COLUMN wrong_questions SMALLINT
    CONSTRAINT chk_wrong_questions_nonnegative CHECK (wrong_questions >= 0);
