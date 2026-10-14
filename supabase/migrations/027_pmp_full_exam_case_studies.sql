-- =============================================================================
-- 027 — Four kept PMP full exams open with two case studies.
--
-- Each exam takes 10 consecutive questions of the Case Studies exam (2 case
-- studies), shared, not copied. Questions are dropped from the end so the exam
-- stays at most 180. Attempts read question_ids_snapshot, so history is untouched.
-- =============================================================================

BEGIN;

-- first_index: where the exam's two case studies start in the Case Studies exam.
CREATE TEMP TABLE case_study_wiring (
  exam_id      smallint PRIMARY KEY,
  first_index  smallint NOT NULL
) ON COMMIT DROP;

INSERT INTO case_study_wiring (exam_id, first_index) VALUES
  (16, 0),   -- PMP Core 2026: case studies 1-2
  (15, 10),  -- PMI Exam 3: case studies 3-4
  (12, 20),  -- PMP Full Exam ECO 1: case studies 5-6
  (13, 30);  -- PMP Full Exam ECO 2: case studies 7-8


-- 1. Drop from the end: original questions keep at most 170 places.
DELETE FROM public.exam_questions eq
USING case_study_wiring w
WHERE eq.exam_id = w.exam_id
  AND eq.question_index >= 170;


-- 2. Shift by 10. The primary key is not deferrable, so go through an offset
--    no current index reaches.
UPDATE public.exam_questions eq SET question_index = eq.question_index + 1000
FROM case_study_wiring w WHERE eq.exam_id = w.exam_id;

UPDATE public.exam_questions eq SET question_index = eq.question_index - 990
FROM case_study_wiring w WHERE eq.exam_id = w.exam_id;


-- 3. Case studies at 0-9.
INSERT INTO public.exam_questions (exam_id, question_index, question_id)
SELECT w.exam_id, cs.question_index - w.first_index, cs.question_id
FROM case_study_wiring w
JOIN public.exam_questions cs
  ON cs.question_index BETWEEN w.first_index AND w.first_index + 9
WHERE cs.exam_id = (
  SELECT e.id FROM public.exams e JOIN public.tags t ON t.id = e.tag_id
  WHERE t.code = 'casestudies' AND e.display_order = 1
);


-- 4. All four are now 180 questions.
UPDATE public.exams e
SET question_count = 180,
    description_ar = 'امتحان كامل من 180 سؤالًا يغطي مجالات PMP الثلاثة، بمدة 4 ساعات واستراحتين.',
    description_en = '180 questions across the three PMP domains, timed at 4 hours with two scheduled breaks.'
FROM case_study_wiring w
WHERE e.id = w.exam_id;

COMMIT;
