-- =============================================================================
-- Migration 013: exam_attempts moves onto the multi-track schema
--
-- Every structural change to exam_attempts and its answer rows, plus the data
-- migration that carries the existing attempts across. Functions are NOT here —
-- 014 replaces the write path.
--
-- Consolidates five migrations that were still unapplied everywhere:
--   old 012  remap stored domain attempts onto the merged exam id space
--   old 016  the cleanup: offered_breaks, config_snapshot, dropped columns,
--            attempt_answers, question_ids_snapshot, the two attempt caps
--   old 018  total_questions (the generated column only; its function is in 014)
--   old 020  wrong_questions
--   plus the time_remaining correction described in step 4, which had no
--   migration at all — it was edited into 003 after 003 was applied.
--
-- This file and 015 are the two that rewrite production data that already
-- exists — this one the attempts, 015 the users and their enrollments. Read the
-- guards before changing the order of anything: each step reads a column a
-- later step destroys.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Remap stored domain attempts onto their new exams row.
--
--    The domain banks moved from src/data/exam/domain/<lang>/<n>.json to
--    src/data/exam/<lang>/<n + 17>.json, so every stored domain attempt has to
--    follow its exam. Full exam ids (1-17) are unchanged and are not touched.
--
--    chk_exam_type_domain (003) asserts domain => exam_id IS NULL, which the
--    write below violates. The constraint guards a column pair that step 5
--    removes outright, so it is dropped rather than rewritten.
--
--    category_id is left in place for step 5 to drop, which keeps this
--    statement re-runnable: rows already carrying an exam_id are skipped.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  DROP CONSTRAINT chk_exam_type_domain;

UPDATE public.exam_attempts
   SET exam_id = category_id + 17
 WHERE exam_type = 'domain'
   AND exam_id IS NULL;


-- ---------------------------------------------------------------------------
-- 2. Guards. Both are hard stops: these are student results, and the question
--    of which exam they belonged to is one for a human, not a silent DELETE.
-- ---------------------------------------------------------------------------

-- 2a. Post-condition of step 1. category_id is about to be dropped and is the
--     only record of which domain an attempt belonged to, so refuse to proceed
--     if the remap did not reach every row.
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
      'Migration 013: % domain attempt(s) still have exam_id IS NULL after the remap in step 1.',
      v_unmapped;
  END IF;
END $$;

-- 2b. Every exam_id must resolve to an exams row (011). Checked here rather
--     than at the foreign key in step 10, because step 3's config_snapshot
--     backfill joins public.exams: an orphan would surface there as an opaque
--     "column contains null values" on SET NOT NULL instead of this message.
--
--     THE LIKELY CAUSE IS EXAMS 1, 3 AND 5. They are held out of the catalogue
--     while their Arabic and English banks disagree (see 011), so any attempt
--     sat on one of them is an orphan. Resolve the conflicts in
--     src/data/exam/, drop the ids from EXCLUDED_EXAM_IDS in
--     scripts/generate-content-migrations.py, regenerate 011 and 012, and
--     replay. Do NOT delete the attempts.
DO $$
DECLARE
  v_orphans INTEGER;
  v_ids     TEXT;
BEGIN
  SELECT count(*), string_agg(DISTINCT a.exam_id::TEXT, ', ' ORDER BY a.exam_id::TEXT)
    INTO v_orphans, v_ids
    FROM public.exam_attempts a
   WHERE a.exam_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.exams x WHERE x.id = a.exam_id);

  IF v_orphans > 0 THEN
    RAISE EXCEPTION
      'Migration 013: % attempt(s) reference exam id(s) [%] with no exams row. See the comment above this check.',
      v_orphans, v_ids;
  END IF;
END $$;


-- ---------------------------------------------------------------------------
-- 3. offered_breaks, and the backfill of the offers already recorded.
--
--    One row per break actually offered during an attempt. Replaces the two
--    fixed break_(1|2)_offered_at columns, which cannot express the N breaks
--    per config that public.breaks allows.
--
--    The backfill must run before step 5 drops those columns — they are the
--    only record of these offers. Historical break indices were hardcoded in
--    the frontend as BREAK_THRESHOLDS = { 1: 60, 2: 120 } (src/utils/progress.ts).
-- ---------------------------------------------------------------------------
CREATE TABLE public.offered_breaks (
  attempt_id     uuid         NOT NULL REFERENCES public.exam_attempts (id) ON DELETE CASCADE,
  show_at_index  smallint     NOT NULL CHECK (show_at_index >= 0),
  offered_at     timestamptz  NOT NULL,

  PRIMARY KEY (attempt_id, show_at_index)
);

INSERT INTO public.offered_breaks (attempt_id, show_at_index, offered_at)
SELECT id, 60::smallint, break_1_offered_at
  FROM public.exam_attempts
 WHERE break_1_offered_at IS NOT NULL;

INSERT INTO public.offered_breaks (attempt_id, show_at_index, offered_at)
SELECT id, 120::smallint, break_2_offered_at
  FROM public.exam_attempts
 WHERE break_2_offered_at IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 4. config_snapshot — an attempt owns the rules it was sat under.
--
--    Added nullable, backfilled from each attempt's exam -> exam_config ->
--    breaks, then set NOT NULL. Must run before exam_id's own NOT NULL in
--    step 5 so this UPDATE can still join on it.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ADD COLUMN config_snapshot jsonb;

UPDATE public.exam_attempts a
   SET config_snapshot = jsonb_build_object(
         'exam_duration_minutes', c.exam_duration_minutes,
         'passing_rate', c.passing_rate,
         'can_reveal_answers', c.can_reveal_answers,
         'allow_retry_wrong', c.allow_retry_wrong,
         'breaks', COALESCE(
           (SELECT jsonb_agg(
                     jsonb_build_object(
                       'show_at_index', b.show_at_index,
                       'duration_minutes', b.duration_minutes
                     )
                     ORDER BY b.show_at_index
                   )
              FROM public.breaks b
             WHERE b.config_id = c.id),
           '[]'::jsonb
         )
       )
  FROM public.exams x
  JOIN public.exam_config c ON c.id = x.config_id
 WHERE a.exam_id = x.id;

ALTER TABLE public.exam_attempts
  ALTER COLUMN config_snapshot SET NOT NULL;


-- ---------------------------------------------------------------------------
-- 5. time_remaining becomes nullable, because an untimed exam has no clock.
--
--    003 declared this NOT NULL DEFAULT 0 back when every exam was timed. The
--    domain config is now untimed (011), so start_attempt writes NULL here and
--    save_attempt/submit_attempt reject a payload whose clock disagrees with
--    the attempt's own snapshot. Without this change the first untimed attempt
--    fails on the not-null constraint.
--
--    DROP CONSTRAINT IF EXISTS before ADD: 003 was briefly edited in the repo
--    to declare chk_time_remaining itself, so a database replayed from that
--    version already has the constraint while production does not. This lands
--    both on the same shape.
--
--    Then: legacy attempts on a now-untimed exam carry an integer clock that
--    their snapshot says they never had. save_attempt compares
--    (duration IS NULL) against (time_remaining IS NULL) and returns
--    'invalid_time' when they disagree, so an in-progress domain attempt would
--    be unsaveable. Null the clock to match the snapshot.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ALTER COLUMN time_remaining DROP NOT NULL,
  ALTER COLUMN time_remaining DROP DEFAULT;

ALTER TABLE public.exam_attempts
  DROP CONSTRAINT IF EXISTS chk_time_remaining;

ALTER TABLE public.exam_attempts
  ADD CONSTRAINT chk_time_remaining
    CHECK (time_remaining IS NULL OR time_remaining >= 0);

UPDATE public.exam_attempts
   SET time_remaining = NULL
 WHERE config_snapshot->>'exam_duration_minutes' IS NULL
   AND time_remaining IS NOT NULL;


-- ---------------------------------------------------------------------------
-- 6. Drop the superseded exam_attempts columns.
--
--    The CHECK constraints chk_exam_type, chk_exam_type_full, chk_review_state,
--    chk_email_report_state, chk_break_1_full_only and chk_break_2_full_only
--    reference these columns and are dropped with them. (chk_exam_type_domain
--    went in step 1.)
--
--    exam_id becomes NOT NULL in the same statement: every attempt now points
--    at an exams row, and step 2 has already proven no row is left without one.
--
--    Dropped because:
--      parent_attempt_id   revision attempts are never stored
--      exam_type           'full' / 'domain' are not real kinds any more
--      category_id         a domain is just another exam now
--      review_state        routing no longer needs it
--      email_report_state  email reports are gone
--      break_*_offered_at  breaks belong to offered_breaks (step 3)
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
-- 7. exam_attempt_questions -> attempt_answers.
--
--    Choices are no longer reordered, so the stored order is dead weight.
--    Constraint and index names are renamed with the table so the schema does
--    not carry the old name in its metadata.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempt_questions RENAME TO attempt_answers;

ALTER TABLE public.attempt_answers DROP COLUMN choices_order;

ALTER INDEX public.exam_attempt_questions_pkey RENAME TO attempt_answers_pkey;

ALTER TABLE public.attempt_answers
  RENAME CONSTRAINT exam_attempt_questions_attempt_id_fkey TO attempt_answers_attempt_id_fkey;


-- ---------------------------------------------------------------------------
-- 8. question_ids_snapshot — the ordered question set, frozen at creation.
--
--    Editing an exam's exam_questions rows later must never change an existing
--    attempt, same rationale as config_snapshot.
--
--    Backfilled from attempt_answers, which at this point still carries
--    question_index: those rows are the ONLY record of the order, and step 9
--    drops the column. The order of operations here is not stylistic.
--
--    Attempts with no answer rows fall back to their exam's current question
--    list. A seeded attempt has none, and an attempt abandoned before the first
--    answer has none either; without the fallback both backfill to '{}' and
--    fail the cardinality CHECK below.
--
--    Note on an old hazard that no longer exists: while the exclusion was per
--    QUESTION, a pre-existing attempt on exam 1, 3 or 5 could copy ids the
--    questions table does not hold, because an integer[] is not foreign-key
--    checked. Exclusion is now per EXAM and step 2b refuses such an attempt
--    outright, so no attempt reaching this point can carry an unknown id.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ADD COLUMN question_ids_snapshot integer[];

UPDATE public.exam_attempts a
   SET question_ids_snapshot = s.ids
  FROM (
        SELECT attempt_id,
               array_agg(question_id ORDER BY question_index) AS ids
          FROM public.attempt_answers
         GROUP BY attempt_id
       ) s
 WHERE s.attempt_id = a.id;

UPDATE public.exam_attempts a
   SET question_ids_snapshot = s.ids
  FROM (
        SELECT exam_id,
               array_agg(question_id ORDER BY question_index) AS ids
          FROM public.exam_questions
         GROUP BY exam_id
       ) s
 WHERE s.exam_id = a.exam_id
   AND (a.question_ids_snapshot IS NULL OR cardinality(a.question_ids_snapshot) = 0);

-- Anything still empty belongs to an exam with no questions, which 012 already
-- refuses to produce. Fail rather than write a row that cannot be sat.
DO $$
DECLARE
  v_empty INTEGER;
BEGIN
  SELECT count(*)
    INTO v_empty
    FROM public.exam_attempts
   WHERE question_ids_snapshot IS NULL
      OR cardinality(question_ids_snapshot) = 0;

  IF v_empty > 0 THEN
    RAISE EXCEPTION
      'Migration 013: % attempt(s) resolved to an empty question set. Their exam has no exam_questions rows.',
      v_empty;
  END IF;
END $$;

ALTER TABLE public.exam_attempts
  ALTER COLUMN question_ids_snapshot SET NOT NULL,
  ADD CONSTRAINT chk_question_ids_snapshot_not_empty
    CHECK (cardinality(question_ids_snapshot) > 0);


-- ---------------------------------------------------------------------------
-- 9. attempt_answers becomes sparse.
--
--    A row now exists only for a question the student answered or bookmarked.
--    Unanswered questions have no row at all, and total_questions is read from
--    question_ids_snapshot (step 10) rather than counted here.
--
--    The deletes are not cleanup for its own sake — each removes rows that the
--    constraints added afterwards would reject:
--      a. empty and un-bookmarked rows: every pre-existing attempt carries one
--         row per question, most of them never touched.
--      b. rows pointing at a question that is not in the database, which the
--         new foreign key would refuse.
--      c. duplicate (attempt_id, question_id) pairs, which the new primary key
--         forbids. No exam contains the same question twice, so this can only
--         come from a malformed historical write; the earliest row wins.
-- ---------------------------------------------------------------------------
DELETE FROM public.attempt_answers
 WHERE cardinality(selected_choices) = 0
   AND NOT is_bookmarked;

DELETE FROM public.attempt_answers r
 WHERE NOT EXISTS (SELECT 1 FROM public.questions q WHERE q.id = r.question_id);

DELETE FROM public.attempt_answers r
 WHERE EXISTS (
         SELECT 1
           FROM public.attempt_answers other
          WHERE other.attempt_id     = r.attempt_id
            AND other.question_id    = r.question_id
            AND other.question_index < r.question_index
       );

ALTER TABLE public.attempt_answers
  DROP CONSTRAINT attempt_answers_pkey;

ALTER TABLE public.attempt_answers
  DROP COLUMN question_index;

ALTER TABLE public.attempt_answers
  ADD CONSTRAINT attempt_answers_pkey PRIMARY KEY (attempt_id, question_id),
  ADD CONSTRAINT attempt_answers_question_id_fkey
    FOREIGN KEY (question_id) REFERENCES public.questions (id) ON DELETE RESTRICT,
  ADD CONSTRAINT chk_answered_or_bookmarked
    CHECK (cardinality(selected_choices) > 0 OR is_bookmarked);


-- ---------------------------------------------------------------------------
-- 10. exam_attempts.exam_id gains its foreign key, and the two derived columns.
--
--     RESTRICT, never CASCADE: deleting an exam must not destroy the history of
--     students who sat it. With this in place an attempt can no longer point at
--     a missing exam, so no screen needs a fallback for a dangling exam_id.
--     Orphans were ruled out in step 2b, so this constraint cannot fail.
--
--     exams.id is smallint, so exam_id is narrowed to match. 003 declared it
--     integer back when it held a bank file number that referenced nothing. A
--     foreign key across two integer widths works, but it makes every function
--     returning the column declare the wider type and it indexes less tightly.
--
--     total_questions is a stored generated column, so the attempt list no
--     longer ships question_ids_snapshot (up to 185 int4 per row, 25 rows per
--     request) purely to read its length in TypeScript. cardinality() is
--     immutable, which is what lets this be generated rather than a trigger,
--     and chk_question_ids_snapshot_not_empty already guarantees it is >= 1.
--     NOT NULL is declared explicitly: a generated column is nullable by
--     default and the type generator reads that literally.
--
--     wrong_questions is the one piece of a graded attempt that used to exist
--     only in submit_attempt's return row. Storing it makes the backend the
--     single source of truth for a completed attempt's result, matching score
--     and status. NULL while in-progress, same convention as status — no
--     cross-column CHECK ties it to exam_state, matching score/status.
-- ---------------------------------------------------------------------------
ALTER TABLE public.exam_attempts
  ALTER COLUMN exam_id TYPE smallint;

ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES public.exams (id) ON DELETE RESTRICT,
  ADD COLUMN total_questions INTEGER NOT NULL
    GENERATED ALWAYS AS (cardinality(question_ids_snapshot)) STORED,
  ADD COLUMN wrong_questions SMALLINT
    CONSTRAINT chk_wrong_questions_nonnegative CHECK (wrong_questions >= 0);


-- ---------------------------------------------------------------------------
-- 11. Two attempt caps, replacing the single 15-per-user cap of 003.
--
--       25 per (user_id, track_id), track resolved through exams
--       50 per user_id
--
--     Over either cap the oldest attempt by created_at in that scope is
--     deleted, whatever state it is in. The row just inserted is excluded from
--     eviction, so a student can never lose the attempt they are starting.
--
--     Accepted consequence: a student resuming an old attempt in one tab while
--     starting a new exam in another can have the resumed attempt evicted. Its
--     next autosave 404s.
--
--     WHILE rather than IF: a cap lowered later would otherwise take one insert
--     per excess row to converge.
--
--     Replaces the body only. trg_enforce_attempt_limit (003) already points at
--     this function and keeps firing — there is no new trigger to create.
--
--     NO uniqueness constraint on live attempts, deliberately. Several
--     in-progress attempts for the same (user, exam) are legitimate: a student
--     can start an exam, abandon it, start it again and abandon that too. There
--     is no server-side de-duplication of a double click either; sending the
--     request once is the frontend's job. Growth is bounded by these caps.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_attempt_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
  c_per_track CONSTANT INTEGER := 25;
  c_per_user  CONSTANT INTEGER := 50;
  v_track_id  UUID;
  v_oldest_id UUID;
BEGIN
  SELECT x.track_id
    INTO v_track_id
    FROM public.exams x
   WHERE x.id = NEW.exam_id;

  -- Per (user, track)
  WHILE (
    SELECT count(*)
      FROM public.exam_attempts a
      JOIN public.exams x ON x.id = a.exam_id
     WHERE a.user_id = NEW.user_id
       AND x.track_id = v_track_id
  ) > c_per_track LOOP
    SELECT a.id
      INTO v_oldest_id
      FROM public.exam_attempts a
      JOIN public.exams x ON x.id = a.exam_id
     WHERE a.user_id = NEW.user_id
       AND x.track_id = v_track_id
       AND a.id <> NEW.id
     ORDER BY a.created_at ASC
     LIMIT 1;

    EXIT WHEN v_oldest_id IS NULL;
    DELETE FROM public.exam_attempts WHERE id = v_oldest_id;
  END LOOP;

  -- Per user, across every track
  WHILE (
    SELECT count(*) FROM public.exam_attempts a WHERE a.user_id = NEW.user_id
  ) > c_per_user LOOP
    SELECT a.id
      INTO v_oldest_id
      FROM public.exam_attempts a
     WHERE a.user_id = NEW.user_id
       AND a.id <> NEW.id
     ORDER BY a.created_at ASC
     LIMIT 1;

    EXIT WHEN v_oldest_id IS NULL;
    DELETE FROM public.exam_attempts WHERE id = v_oldest_id;
  END LOOP;

  RETURN NULL; -- AFTER trigger; return value is ignored
END;
$$;


-- =============================================================================
-- Left broken on purpose, replaced by 014:
--
--   public.insert_attempt  writes exam_type, category_id and choices_order, and
--                          targets exam_attempt_questions by its old name
--   public.save_attempt    writes review_state, email_report_state and both
--                          break_*_offered_at, and targets the old table name
--
-- Postgres does not track dependencies into a function whose body is a string
-- literal, so both survive this migration and raise at call time. 014 drops and
-- replaces them. Break offers also have no write path between here and 014:
-- they used to ride along on save_attempt.
-- =============================================================================
