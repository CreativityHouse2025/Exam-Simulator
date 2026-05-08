-- =============================================================================
-- Migration 003: exam_attempts & exam_attempt_questions
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. exam_attempts
-- ---------------------------------------------------------------------------
CREATE TABLE public.exam_attempts (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID          NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_attempt_id   UUID          REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  exam_type           TEXT          NOT NULL,
  exam_id             INTEGER,
  category_id         INTEGER,
  current_index       SMALLINT      NOT NULL DEFAULT 0,
  time_remaining      INTEGER       NOT NULL DEFAULT 0,
  exam_state          TEXT          NOT NULL DEFAULT 'in-progress',
  review_state        TEXT          NOT NULL DEFAULT 'summary',
  email_report_state  TEXT          NOT NULL DEFAULT 'unsent',
  status              TEXT,
  score               NUMERIC(5,2)  NOT NULL DEFAULT 0.00,
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),

  -- Enum-style CHECK constraints
  CONSTRAINT chk_exam_type           CHECK (exam_type          IN ('full', 'domain')),
  CONSTRAINT chk_exam_state          CHECK (exam_state         IN ('in-progress', 'completed')),
  CONSTRAINT chk_review_state        CHECK (review_state       IN ('summary', 'question')),
  CONSTRAINT chk_email_report_state  CHECK (email_report_state IN ('unsent', 'pending', 'sent', 'failed')),
  CONSTRAINT chk_status              CHECK (status             IN ('pass', 'fail')),

  -- Mutual exclusivity: full requires exam_id, domain requires category_id
  CONSTRAINT chk_exam_type_full   CHECK (
    exam_type <> 'full'   OR (exam_id IS NOT NULL AND category_id IS NULL)
  ),
  CONSTRAINT chk_exam_type_domain CHECK (
    exam_type <> 'domain' OR (category_id IS NOT NULL AND exam_id IS NULL)
  )
);

-- ---------------------------------------------------------------------------
-- 2. exam_attempt_questions
-- ---------------------------------------------------------------------------
CREATE TABLE public.exam_attempt_questions (
  attempt_id        UUID        NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_index    SMALLINT    NOT NULL,
  question_id       INTEGER     NOT NULL,
  choices_order     SMALLINT[]  NOT NULL,
  selected_choices  SMALLINT[]  NOT NULL DEFAULT '{}',
  is_bookmarked     BOOLEAN     NOT NULL DEFAULT false,

  PRIMARY KEY (attempt_id, question_index)
);

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

-- Serves both the attempt history list (WHERE user_id = ?) and the cleanup
-- trigger (WHERE user_id = ? ORDER BY created_at ASC LIMIT 1).
-- A separate single-column index on user_id is unnecessary — Postgres uses the
-- leading column of this composite index for user_id-only lookups.
CREATE INDEX idx_exam_attempts_user_created ON public.exam_attempts (user_id, created_at);

-- ---------------------------------------------------------------------------
-- 4. updated_at trigger (reuses existing function)
-- ---------------------------------------------------------------------------
CREATE TRIGGER set_exam_attempts_updated_at
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Cleanup trigger — cap total attempts at 10 per user
--
--    Fires AFTER INSERT. If the user already has 10 or more attempts
--    (regardless of completion state), the oldest attempt (by created_at)
--    is deleted. ON DELETE CASCADE on exam_attempt_questions handles child
--    row cleanup.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_attempt_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_attempt_count INTEGER;
  v_oldest_id     UUID;
BEGIN
  SELECT count(*)
    INTO v_attempt_count
    FROM public.exam_attempts
   WHERE user_id = NEW.user_id;

  IF v_attempt_count >= 10 THEN
    SELECT id
      INTO v_oldest_id
      FROM public.exam_attempts
     WHERE user_id = NEW.user_id
     ORDER BY created_at ASC
     LIMIT 1;

    DELETE FROM public.exam_attempts WHERE id = v_oldest_id;
  END IF;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_attempt_limit
  AFTER INSERT ON public.exam_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_attempt_limit();
