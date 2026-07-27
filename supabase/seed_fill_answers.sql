-- Fills exam_attempt_questions for exam_attempts inserted by seed.sql that don't have any yet
-- (mock question ids/choices, used for count only) so `total_questions` — and therefore the
-- student-attempts detail view — is populated instead of always reading 0.
-- Safe to re-run: skips attempts that already have question rows.
insert into public.exam_attempt_questions (attempt_id, question_index, question_id, choices_order, selected_choices)
select
  ea.id,
  q.i,
  1000 + q.i,
  array[0, 1, 2, 3]::smallint[],
  case when ea.exam_state = 'completed' then array[0]::smallint[] else array[]::smallint[] end
from public.exam_attempts ea
join public.users u on u.id = ea.user_id
cross join lateral generate_series(
  0,
  (case ea.status when 'pass' then 19 when 'fail' then 14 else 19 end)
) as q(i)
where u.role = 'student'
  and not exists (
    select 1 from public.exam_attempt_questions eaq where eaq.attempt_id = ea.id
  );
