-- =============================================================================
-- 024 — PMP full exam breaks move to after Q40 and Q110.
--
-- Attempts read their config_snapshot, so started and finished attempts keep
-- their original breaks.
-- =============================================================================

BEGIN;

UPDATE public.breaks
SET show_at_index = CASE show_at_index WHEN 60 THEN 40 WHEN 120 THEN 110 END
WHERE config_id = 1
  AND show_at_index IN (60, 120);

COMMIT;
