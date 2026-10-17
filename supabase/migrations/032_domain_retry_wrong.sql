-- =============================================================================
-- 030 — PMP domain exams allow retrying wrong answers.
--
-- Attempts read their config_snapshot, so attempts started before this keep
-- retry disabled.
-- =============================================================================

BEGIN;

UPDATE public.exam_config
SET allow_retry_wrong = true
WHERE id = 2;

COMMIT;
