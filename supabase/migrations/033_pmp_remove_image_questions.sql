-- =============================================================================
-- 033 — Remove image questions from the three PMP Core October 2026 exams.
--
-- Nine questions whose images were written out as text are unlinked; the
-- question rows stay. Each target is matched by exam name, position and the
-- start of its English text, so a drifted position aborts instead of removing
-- the wrong question. Attempts read question_ids_snapshot, so history is untouched.
-- =============================================================================

BEGIN;

-- question_index is 0-based: sheet position minus 1.
CREATE TEMP TABLE image_questions (
  exam_name       text      NOT NULL,
  question_index  smallint  NOT NULL,
  opens_with      text      NOT NULL,
  PRIMARY KEY (exam_name, question_index)
) ON COMMIT DROP;

INSERT INTO image_questions (exam_name, question_index, opens_with) VALUES
  ('PMP Core October 2026 (1)',  45, 'A retailer is losing sales because customers are not being informed'),
  ('PMP Core October 2026 (1)',  72, 'The project manager uses story points to track progress'),
  ('PMP Core October 2026 (1)',  76, 'A project team has been assigned to execute a data-driven marketing'),
  ('PMP Core October 2026 (1)',  79, 'During a sprint review, the Scrum Master presents the project team'),
  ('PMP Core October 2026 (2)',  81, 'Over the past 12 months, the project manager has tracked team progress'),
  ('PMP Core October 2026 (2)', 105, 'Stakeholders request an update on team progress across iterations.'),
  ('PMP Core October 2026 (2)', 107, 'The project team uses three-point estimates for several activities.'),
  ('PMP Core October 2026 (2)', 161, 'A project manager compares actual revenue with forecast revenue'),
  ('PMP Core October 2026 (3)', 105, 'You are the project manager for a software development project using');

CREATE TEMP TABLE affected_exams ON COMMIT DROP AS
SELECT DISTINCT e.id AS exam_id
FROM image_questions t JOIN public.exams e ON e.name_en = t.exam_name;


-- 1. Every target is where the stakeholder list says it is.
DO $$
DECLARE
  v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM image_questions t
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.exam_questions eq ON eq.exam_id = e.id AND eq.question_index = t.question_index
    JOIN public.questions q ON q.id = eq.question_id
    WHERE e.name_en = t.exam_name
      AND starts_with(q.text_en, t.opens_with)
  );
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Migration 033: % image question(s) not found at their expected position', v_bad;
  END IF;
END $$;


-- 2. Unlink.
DELETE FROM public.exam_questions eq
USING image_questions t, public.exams e
WHERE e.name_en = t.exam_name
  AND eq.exam_id = e.id
  AND eq.question_index = t.question_index;


-- 3. Close the gaps. The primary key is not deferrable, so go through an offset
--    no current index reaches.
UPDATE public.exam_questions eq SET question_index = 1000 + r.new_index
FROM (
  SELECT exam_id, question_index,
         row_number() OVER (PARTITION BY exam_id ORDER BY question_index) - 1 AS new_index
  FROM public.exam_questions
  WHERE exam_id IN (SELECT exam_id FROM affected_exams)
) r
WHERE eq.exam_id = r.exam_id AND eq.question_index = r.question_index;

UPDATE public.exam_questions eq SET question_index = eq.question_index - 1000
WHERE eq.exam_id IN (SELECT exam_id FROM affected_exams);


-- 4. question_count and descriptions follow the rows.
UPDATE public.exams e
SET question_count = c.n,
    description_ar = format('امتحان كامل من %s سؤالًا يغطي مجالات PMP الثلاثة، بمدة 4 ساعات واستراحتين.', c.n),
    description_en = format('%s questions across the three PMP domains, timed at 4 hours with two scheduled breaks.', c.n)
FROM (
  SELECT exam_id, count(*) AS n
  FROM public.exam_questions
  WHERE exam_id IN (SELECT exam_id FROM affected_exams)
  GROUP BY exam_id
) c
WHERE e.id = c.exam_id;


-- 5. Expected totals: 180 - 4, 176 - 4, 180 - 1.
DO $$
DECLARE
  v_bad int;
BEGIN
  SELECT count(*) INTO v_bad
  FROM (VALUES ('PMP Core October 2026 (1)', 176),
               ('PMP Core October 2026 (2)', 172),
               ('PMP Core October 2026 (3)', 179)) AS x(name_en, expected)
  JOIN public.exams e ON e.name_en = x.name_en
  WHERE e.question_count <> x.expected;
  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Migration 033: % exam(s) did not end at their expected question count', v_bad;
  END IF;
END $$;

COMMIT;
