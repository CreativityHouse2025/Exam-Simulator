-- =============================================================================
-- Migration 016: exam_attempts cleanup for the multi-track schema
--
-- Renamed from 013. It has to run after the content migrations (013-015):
-- its config_snapshot backfill joins public.exams and public.exam_config, and
-- the attempt_answers -> questions foreign key it adds needs the seeded rows.
-- See spec-add-tracks-api.md 11.0/11.1.
--
-- Implements the cleanup decisions in docs/specs/spec-add-tracks.md:
--   (1) revision attempts are never stored   -> drop parent_attempt_id
--   (2) 'full' / 'domain' are not real kinds  -> drop exam_type, category_id
--   (3) routing no longer needs review_state  -> drop review_state
--   (4) email reports are gone                -> drop email_report_state
--   (5) breaks belong to their own table      -> offered_breaks
--   (6) exam_attempt_questions -> attempt_answers, drop choices_order
--   (17) an attempt snapshots its exam's config at start time -> config_snapshot
--
-- and, from spec-add-tracks-api.md:
--   (8.1) an attempt snapshots its question set and order -> question_ids_snapshot
--   (8.3) attempt_answers is sparse: a row means answered or bookmarked
--   (8.6) exam_attempts.exam_id narrows to smallint and gains its foreign key,
--         ON DELETE RESTRICT
--   (8.4) one attempt cap becomes two: 25 per track, 50 per user
--   (8.5) several in-progress attempts per (user, exam) stay legal - see step 10
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
      'Migration 016: % domain attempt(s) still have exam_id IS NULL. Run the domain remap (spec decision 10) before dropping category_id.',
      v_unmapped;
  END IF;
END $$;

-- Every exam_id must resolve to an exams row (013). Checked here, not at the
-- foreign key in step 8: step 3's config_snapshot backfill joins public.exams,
-- so an orphan would surface there as an opaque "column contains null values"
-- on SET NOT NULL instead of this message. Orphans are a hard stop rather than
-- a silent DELETE — they are student results, and which exam they belonged to
-- is a question for a human.
DO $$
DECLARE
  v_orphans INTEGER;
BEGIN
  SELECT count(*)
    INTO v_orphans
    FROM public.exam_attempts a
   WHERE a.exam_id IS NOT NULL
     AND NOT EXISTS (SELECT 1 FROM public.exams x WHERE x.id = a.exam_id);

  IF v_orphans > 0 THEN
    RAISE EXCEPTION
      'Migration 016: % attempt(s) reference an exam_id with no exams row. Resolve them before running this migration.',
      v_orphans;
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
-- 3. config_snapshot (spec decision 17). Added nullable, backfilled from each
--    attempt's exam -> exam_config -> breaks, then set NOT NULL. Must run
--    before exam_id's own NOT NULL is set below so this UPDATE can still
--    join on it, and before dropping the columns step 4 removes — none of
--    those are read here, but the join must happen before both are gone.
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
-- 4. Drop the superseded exam_attempts columns.
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
-- 5. exam_attempt_questions -> attempt_answers (spec decision 6).
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
-- 6. exam_attempts.question_ids_snapshot (spec 8.1).
--
--    The ordered question set of this attempt, frozen at creation. Editing an
--    exam's exam_questions rows later must never change an existing attempt —
--    same rationale as config_snapshot.
--
--    Backfilled from attempt_answers, which at this point still carries
--    question_index: those rows are the ONLY record of the order, and step 7
--    drops the column. Order of operations here is not stylistic.
--
--    Attempts with no answer rows fall back to their exam's current question
--    list. The local seed creates attempts without answer rows, and an attempt
--    abandoned before the first answer has none either; without the fallback
--    both backfill to '{}' and fail the cardinality CHECK below.
--
--    KNOWN AND ACCEPTED (review-migrations-011-017.md finding 2): the first
--    UPDATE copies whatever ids the answer rows hold, including the 8 ar/en
--    conflicts that 015 excludes. Step 7 deletes those answer rows via the new
--    foreign key, but an integer[] is not foreign-key checked, so a PRE-EXISTING
--    attempt on exam 1, 3 or 5 keeps ids the questions table does not have.
--    Its total_questions then over-counts and content indexed by snapshot
--    position shifts after the missing id. Decided 2026-09-18 to accept rather
--    than filter. New attempts are unaffected: start_attempt reads
--    exam_questions, which never held these ids. Local resets are unaffected
--    too, because the seed's attempts take the fallback above.
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

-- Anything still empty belongs to an exam with no questions, which 015 already
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
      'Migration 016: % attempt(s) resolved to an empty question set. Their exam has no exam_questions rows.',
      v_empty;
  END IF;
END $$;

ALTER TABLE public.exam_attempts
  ALTER COLUMN question_ids_snapshot SET NOT NULL,
  ADD CONSTRAINT chk_question_ids_snapshot_not_empty
    CHECK (cardinality(question_ids_snapshot) > 0);


-- ---------------------------------------------------------------------------
-- 7. attempt_answers becomes sparse (spec 8.3).
--
--    A row now exists only for a question the student answered or bookmarked.
--    Unanswered questions have no row at all, and total_questions is read from
--    question_ids_snapshot rather than counted here (8.2).
--
--    The deletes below are not cleanup for its own sake — each one removes rows
--    that the constraints added afterwards would reject:
--      a. empty and un-bookmarked rows: every pre-existing attempt carries one
--         row per question, most of them never touched.
--      b. rows pointing at a question that is not in the database. That is the
--         8 excluded ar/en conflicts (see the top of the spec), plus anything
--         else the FK would refuse.
--      c. duplicate (attempt_id, question_id) pairs, which the new primary key
--         forbids. No exam contains the same question twice (6.4), so this can
--         only come from a malformed historical write; the earliest row wins.
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
-- 8. exam_attempts.exam_id FK -> exams (spec 8.6).
--
--    RESTRICT, never CASCADE: deleting an exam must not destroy the history of
--    students who sat it. With this in place an attempt can no longer point at
--    a missing exam, so no screen needs a fallback for a dangling exam_id.
--
--    Orphans were already ruled out in step 0, so this constraint cannot fail.
-- ---------------------------------------------------------------------------

-- exams.id is smallint, so exam_id is narrowed to match. 003 declared it integer
-- back when it held a bank file number that referenced nothing. A foreign key
-- across two different integer widths works, but it makes every function that
-- returns the column declare the wider type and it indexes less tightly.
ALTER TABLE public.exam_attempts
  ALTER COLUMN exam_id TYPE smallint;

ALTER TABLE public.exam_attempts
  ADD CONSTRAINT exam_attempts_exam_id_fkey
    FOREIGN KEY (exam_id) REFERENCES public.exams (id) ON DELETE RESTRICT;


-- ---------------------------------------------------------------------------
-- 9. Two attempt caps (spec 8.4), replacing the single 15-per-user cap of 003.
--
--      25 per (user_id, track_id), track resolved through exams
--      50 per user_id
--
--    Over either cap the oldest attempt by created_at in that scope is deleted,
--    whatever state it is in. The row just inserted is excluded from eviction,
--    so a student can never lose the attempt they are starting.
--
--    Accepted consequence (8.4): a student resuming an old attempt in one tab
--    while starting a new exam in another can have the resumed attempt evicted.
--    Its next autosave 404s.
--
--    WHILE rather than IF: a cap lowered later would otherwise take one insert
--    per excess row to converge.
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


-- ---------------------------------------------------------------------------
-- 10. NO uniqueness constraint on live attempts, deliberately.
--
--     Several in-progress attempts for the same (user, exam) are a legitimate
--     state: a student can start an exam, abandon it, start it again and
--     abandon that too. That is normal use, not corruption.
--
--     There is no server-side de-duplication of a double click either: every
--     call to start_attempt creates an attempt. Sending the request once is the
--     frontend's job.
--
--     Growth is bounded by the caps in step 9, not by uniqueness.
-- ---------------------------------------------------------------------------


-- =============================================================================
-- Deferred / broken by this migration — spec decision (4) says highlight, not
-- silently fix:
--
--   public.insert_attempt  — writes exam_type, category_id and choices_order,
--                            and targets exam_attempt_questions by its old name
--   public.save_attempt    — writes review_state, email_report_state and both
--                            break_*_offered_at, and targets the old table name
--
--   Both still exist and will raise at call time until 017 replaces them.
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
--   save_attempt. A write to public.offered_breaks must be added in 017.
-- =============================================================================
