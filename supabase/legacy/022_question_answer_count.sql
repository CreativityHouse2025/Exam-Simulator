-- =============================================================================
-- Migration 022: questions.answer_count
--
-- How many choices are correct, per question — 2,991 questions have exactly
-- one, 139 have two to four (confirmed against the local seed). Nothing about
-- undisclosed question content said which cardinality a question was: the
-- client could not tell a single-answer question from a "choose two" one
-- before disclosure, because is_correct itself is only ever selected once
-- disclosing (questionService.getQuestions).
--
-- answer_count is not the answer key — it is a count, not a set of positions
-- — so it is safe to select on every read regardless of discloseAnswers, and
-- the UI (MultipleChoice) uses it to decide radio-vs-checkbox and to cap
-- selection at the right number before the key is ever revealed.
--
-- Kept in sync by a trigger rather than computed at read time: recomputing
-- count(is_correct) per question on every question read is one query this
-- avoids, and it is what makes answer_count safe to always select.
-- =============================================================================

ALTER TABLE public.questions ADD COLUMN answer_count SMALLINT;

UPDATE public.questions q
   SET answer_count = counted.correct_count
  FROM (
    SELECT question_id, count(*) FILTER (WHERE is_correct) AS correct_count
      FROM public.choices
     GROUP BY question_id
  ) counted
 WHERE q.id = counted.question_id;

ALTER TABLE public.questions
  ALTER COLUMN answer_count SET NOT NULL,
  ADD CONSTRAINT chk_answer_count_positive CHECK (answer_count > 0);

-- ---------------------------------------------------------------------------
-- sync_question_answer_count — keeps answer_count equal to count(is_correct)
-- whenever a question's choices change (an admin correcting a wrong answer
-- key, adding or removing a choice).
--
-- FOR EACH ROW rather than a statement-level trigger: a bulk write to choices
-- (a reseed, a multi-question admin edit) fires this once per affected row,
-- landing on the correct final count per question either way. On a DELETE
-- that cascades from removing the question itself, the UPDATE below simply
-- matches zero rows — the parent is already gone.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_question_answer_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_question_id INTEGER := COALESCE(NEW.question_id, OLD.question_id);
BEGIN
  UPDATE public.questions
     SET answer_count = (
           SELECT count(*) FROM public.choices
            WHERE question_id = v_question_id AND is_correct
         )
   WHERE id = v_question_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER sync_answer_count_on_choices
  AFTER INSERT OR UPDATE OF is_correct OR DELETE ON public.choices
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_question_answer_count();
