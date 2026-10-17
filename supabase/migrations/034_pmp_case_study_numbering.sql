-- =============================================================================
-- 034 — Number the case studies in the active PMP full exams.
--
-- Every case-study question's text opens with "Case Study N, Question M",
-- numbered within its full exam. The label lives in the question text, so a
-- full exam's case-study questions must not be shared: the 40 that 027 linked
-- from the Case Studies exam are copied first, and the Case Studies exam keeps
-- the originals, unlabeled. PMP Aug 2026's case-study titles give way to the label.
--
-- Those 40 now exist twice. A content fix to one must be repeated on the other.
-- Attempts read question_ids_snapshot, so history keeps the original rows.
-- =============================================================================

BEGIN;

-- Case studies open each exam, back to back, all the same size.
CREATE TEMP TABLE case_study_layout (
  exam_name                 text      PRIMARY KEY,
  case_study_count          smallint  NOT NULL,
  questions_per_case_study  smallint  NOT NULL
) ON COMMIT DROP;

INSERT INTO case_study_layout (exam_name, case_study_count, questions_per_case_study) VALUES
  ('PMP Core October 2026 (1)', 1, 10),
  ('PMP Core October 2026 (2)', 1, 9),
  ('PMP Core October 2026 (3)', 3, 6),
  ('PMP Aug 2026',              3, 6),
  ('PMP Core 2026',             2, 5),
  ('PMI Exam 3',                2, 5),
  ('PMP Full Exam ECO 1',       2, 5),
  ('PMP Full Exam ECO 2',       2, 5);

CREATE TEMP TABLE case_study_questions ON COMMIT DROP AS
SELECT e.id                                            AS exam_id,
       eq.question_index,
       eq.question_id,
       eq.question_index / l.questions_per_case_study + 1 AS case_study_no,
       eq.question_index % l.questions_per_case_study + 1 AS question_no,
       false                                           AS is_shared,
       NULL::integer                                   AS copy_id
FROM case_study_layout l
JOIN public.exams e ON e.name_en = l.exam_name
JOIN public.exam_questions eq
  ON eq.exam_id = e.id
 AND eq.question_index < l.case_study_count * l.questions_per_case_study;


-- 1. 95 questions, none labeled yet.
DO $$
DECLARE
  v_total    int;
  v_labeled  int;
BEGIN
  SELECT count(*) INTO v_total FROM case_study_questions;
  IF v_total <> 95 THEN
    RAISE EXCEPTION 'Migration 034: expected 95 case-study questions, found %', v_total;
  END IF;

  SELECT count(*) INTO v_labeled
  FROM case_study_questions c JOIN public.questions q ON q.id = c.question_id
  WHERE q.text_en ~ '^Case Study [0-9]+, Question [0-9]+';
  IF v_labeled > 0 THEN
    RAISE EXCEPTION 'Migration 034: % case-study question(s) are already labeled', v_labeled;
  END IF;
END $$;


-- 2. Pick the shared ones: exactly the 40 that 027 linked from the Case Studies exam.
UPDATE case_study_questions c SET is_shared = true
WHERE EXISTS (
  SELECT 1 FROM public.exam_questions o
  WHERE o.question_id = c.question_id AND o.exam_id <> c.exam_id
);

DO $$
DECLARE
  v_shared int;
BEGIN
  SELECT count(*) INTO v_shared FROM case_study_questions WHERE is_shared;
  IF v_shared <> 40 THEN
    RAISE EXCEPTION 'Migration 034: expected 40 shared case-study questions, found %', v_shared;
  END IF;
END $$;


-- 3. Copy them. Consecutive ids from the questions sequence, in exam then index order.
WITH base AS (SELECT nextval(pg_get_serial_sequence('public.questions', 'id')) AS id),
     ordered AS (SELECT exam_id, question_index,
                        row_number() OVER (ORDER BY exam_id, question_index) - 1 AS n
                 FROM case_study_questions WHERE is_shared)
UPDATE case_study_questions c SET copy_id = base.id + o.n
FROM base, ordered o
WHERE o.exam_id = c.exam_id AND o.question_index = c.question_index;
SELECT setval(pg_get_serial_sequence('public.questions', 'id'), (SELECT max(copy_id) FROM case_study_questions));

INSERT INTO public.questions (id, type, text_ar, text_en, explanation_ar, explanation_en, answer_count)
SELECT c.copy_id, q.type, q.text_ar, q.text_en, q.explanation_ar, q.explanation_en, q.answer_count
FROM case_study_questions c JOIN public.questions q ON q.id = c.question_id
WHERE c.is_shared
ORDER BY c.copy_id;

INSERT INTO public.choices (question_id, position, text_ar, text_en, is_correct)
SELECT c.copy_id, ch.position, ch.text_ar, ch.text_en, ch.is_correct
FROM case_study_questions c JOIN public.choices ch ON ch.question_id = c.question_id
WHERE c.is_shared;

UPDATE public.exam_questions eq SET question_id = c.copy_id
FROM case_study_questions c
WHERE c.is_shared
  AND eq.exam_id = c.exam_id
  AND eq.question_index = c.question_index;

UPDATE case_study_questions SET question_id = copy_id WHERE is_shared;


-- 4. PMP Aug 2026's three scenarios open with a title line ("Case Study 1:
--    Governance Overreach"). The label replaces it.
CREATE TEMP TABLE case_study_titles ON COMMIT DROP AS
SELECT q.id
FROM case_study_questions c JOIN public.questions q ON q.id = c.question_id
WHERE q.text_en ~ '^Case Study [0-9]+: [^\n]*\n';

DO $$
DECLARE
  v_titled  int;
  v_ar      int;
BEGIN
  SELECT count(*) INTO v_titled FROM case_study_titles;
  SELECT count(*) INTO v_ar
  FROM case_study_titles t JOIN public.questions q ON q.id = t.id
  WHERE q.text_ar ~ '^دراسة الحالة [0-9]+: [^\n]*\n';
  IF v_titled <> 3 OR v_ar <> 3 THEN
    RAISE EXCEPTION 'Migration 034: expected 3 titled scenarios in both languages, found % (en) and % (ar)', v_titled, v_ar;
  END IF;
END $$;

UPDATE public.questions q
SET text_en = regexp_replace(q.text_en, '^Case Study [0-9]+: [^\n]*\n\s*', ''),
    text_ar = regexp_replace(q.text_ar, '^دراسة الحالة [0-9]+: [^\n]*\n\s*', '')
FROM case_study_titles t
WHERE q.id = t.id;


-- 5. Label.
UPDATE public.questions q
SET text_en = format('Case Study %s, Question %s', c.case_study_no, c.question_no) || E'\n\n' || q.text_en,
    text_ar = format('دراسة الحالة %s، السؤال %s', c.case_study_no, c.question_no) || E'\n\n' || q.text_ar
FROM case_study_questions c
WHERE q.id = c.question_id;


-- 6. Every labeled question belongs to its full exam alone.
DO $$
DECLARE
  v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM case_study_questions c
  JOIN public.exam_questions o ON o.question_id = c.question_id AND o.exam_id <> c.exam_id;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Migration 034: % labeled question(s) are still shared with another exam', v_bad;
  END IF;
END $$;

COMMIT;
