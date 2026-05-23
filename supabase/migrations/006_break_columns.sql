-- =============================================================================
-- Migration 006: add break tracking columns to exam_attempts
--
-- break_1_offered_at / break_2_offered_at record when each break modal was
-- shown to the user. NULL means the break has not been offered yet; a timestamp
-- means it was offered (and should not be shown again). Both columns must remain
-- ALWAYS NULL for non-full exams.
-- =============================================================================

ALTER TABLE public.exam_attempts
  ADD COLUMN break_1_offered_at TIMESTAMPTZ,
  ADD COLUMN break_2_offered_at TIMESTAMPTZ,

  ADD CONSTRAINT chk_break_1_full_only
    CHECK (break_1_offered_at IS NULL OR exam_type = 'full'),

  ADD CONSTRAINT chk_break_2_full_only
    CHECK (break_2_offered_at IS NULL OR exam_type = 'full');
