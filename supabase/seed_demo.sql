-- Demo attempt history for student@local.test, for the client preview.
--
-- Runs last: it needs the content migrations, the accounts from seed.sql and
-- the enrollments from seed_tracks.sql.
--
-- EVERY ATTEMPT HERE IS BUILT BY CALLING THE RPCs the application calls —
-- start_attempt, save_attempt, submit_attempt — never by INSERT. That matters
-- for three reasons:
--
--   1. config_snapshot and question_ids_snapshot come out exactly as production
--      writes them. The previous fixture pasted a config_snapshot literal with
--      a comment asking the reader to keep it in sync with exam_config by hand.
--   2. Scores are computed by the real grader. A hand-written score can say
--      'pass' while the stored answers say otherwise, and the review screen
--      then contradicts the result badge.
--   3. Running this against the remote is a live smoke test of all three RPCs
--      on that database, which is most of the point of staging.
--
-- Four journeys, chosen to cover every config in the catalogue and every state
-- the attempt UI can be in:
--
--   exam  2  PMP Full    timed 240m   completed, pass   review with answers
--   exam 18  PMP Domain  untimed      completed, pass   NULL clock, reveal mode
--   exam 44  RMP Full    timed 150m   in-progress       resume, bookmarks, break
--   exam 45  RMP Full    timed 150m   completed, fail   revision set available
--
-- Bulk attempts for the other students stay in seed.sql; those give the
-- supervisor's list and search_students their volume. This file is only the
-- one account a reviewer actually signs in as.

-- ---------------------------------------------------------------------
-- Builds a save/submit payload for a whole exam.
--
-- p_correct     how many of the questions to answer correctly
-- p_unanswered  how many to leave with no row at all
--
-- Everything in between gets a single wrong choice. Questions are taken in
-- snapshot order, so the correct ones are the early ones — which is also what
-- makes the resulting current_index believable.
--
-- An entry with no selection and no bookmark is deleted by apply_answer_diff
-- rather than stored, which is how an unanswered question is represented: by
-- the absence of a row. Passing them explicitly exercises that path.
--
-- Multi-answer questions are handled by sending EVERY correct position, since
-- attempt_correct_question_ids compares the selected set to the correct set
-- exactly. Eight RMP questions need this.
--
-- pg_temp: the function belongs to this session only. Creating it in public
-- would leave a routine behind that 016's privilege model never accounted for.
-- ---------------------------------------------------------------------
create or replace function pg_temp.answer_payload(
  p_question_ids integer[],
  p_correct      integer,
  p_unanswered   integer
)
returns jsonb
language sql
stable
as $$
  with ordered as (
    select s.question_id, s.ord
      from unnest(p_question_ids) with ordinality as s(question_id, ord)
  ),
  shaped as (
    select o.question_id,
           o.ord,
           array_agg(c.position order by c.position) filter (where c.is_correct)     as correct_positions,
           min(c.position)                           filter (where not c.is_correct) as one_wrong_position
      from ordered o
      join public.choices c on c.question_id = o.question_id
     group by o.question_id, o.ord
  )
  select coalesce(
           jsonb_agg(
             jsonb_build_object(
               'question_id', question_id,
               'selected_choices',
                 case
                   when ord <= p_correct then to_jsonb(correct_positions)
                   when ord > cardinality(p_question_ids) - p_unanswered then '[]'::jsonb
                   else to_jsonb(array[one_wrong_position])
                 end,
               -- Every 17th question flagged, so the bookmark filter has
               -- something to show on a list of any length.
               'is_bookmarked', (ord % 17 = 0)
             )
             order by ord
           ),
           '[]'::jsonb
         )
    from shaped;
$$;


do $$
declare
  c_student  constant uuid := '22222222-2222-4222-8222-222222222222';

  v_attempt  uuid;
  v_qids     integer[];
  v_n        integer;
  v_result   text;
  v_score    numeric;
  v_status   text;
  v_revision integer;
begin
  -- =================================================================
  -- 1. PMP Full exam, completed with a pass.
  --    passing_rate is 75.00, so 82% correct clears it with room to
  --    spare without looking suspiciously perfect.
  -- =================================================================
  select s.id, s.question_ids_snapshot
    into v_attempt, v_qids
    from public.start_attempt(c_student, 2::smallint) s;

  if v_attempt is null then
    raise exception 'seed_demo: start_attempt returned no attempt for exam 2';
  end if;
  v_n := cardinality(v_qids);

  select public.submit_attempt(
           c_student,
           v_attempt,
           v_n - 1,
           3600,   -- an hour left on a four-hour clock
           pg_temp.answer_payload(v_qids, ceil(v_n * 0.82)::integer, 4)
         )
    into v_result;
  if v_result <> 'ok' then
    raise exception 'seed_demo: submit_attempt on exam 2 returned %', v_result;
  end if;

  select score, status into v_score, v_status
    from public.exam_attempts where id = v_attempt;
  if v_status <> 'pass' then
    raise exception 'seed_demo: exam 2 was meant to pass, scored % (%)', v_score, v_status;
  end if;
  raise notice 'seed_demo: PMP full exam 2 -> % (%)', v_score, v_status;

  -- =================================================================
  -- 2. PMP Domain exam, untimed, completed with a pass.
  --    passing_rate is 85.00 here and the config reveals answers as
  --    you go, so a high score is the realistic outcome.
  --
  --    p_time_remaining is omitted entirely. Sending a number would
  --    return 'invalid_time': the snapshot has no clock.
  -- =================================================================
  select s.id, s.question_ids_snapshot
    into v_attempt, v_qids
    from public.start_attempt(c_student, 18::smallint) s;

  if v_attempt is null then
    raise exception 'seed_demo: start_attempt returned no attempt for exam 18';
  end if;
  v_n := cardinality(v_qids);

  if (select time_remaining from public.exam_attempts where id = v_attempt) is not null then
    raise exception 'seed_demo: exam 18 is untimed but the attempt has a clock';
  end if;

  select public.submit_attempt(
           c_student,
           v_attempt,
           v_n - 1,
           null,
           pg_temp.answer_payload(v_qids, ceil(v_n * 0.93)::integer, 0)
         )
    into v_result;
  if v_result <> 'ok' then
    raise exception 'seed_demo: submit_attempt on exam 18 returned %', v_result;
  end if;

  select score, status into v_score, v_status
    from public.exam_attempts where id = v_attempt;
  raise notice 'seed_demo: PMP domain exam 18 -> % (%), untimed', v_score, v_status;

  -- =================================================================
  -- 3. RMP Full exam, left in progress.
  --    Roughly half answered, with the break at index 58 recorded as
  --    already offered — the state a student is in when they close the
  --    tab mid-sitting and come back to a resume prompt.
  -- =================================================================
  select s.id, s.question_ids_snapshot
    into v_attempt, v_qids
    from public.start_attempt(c_student, 44::smallint) s;

  if v_attempt is null then
    raise exception 'seed_demo: start_attempt returned no attempt for exam 44';
  end if;
  v_n := cardinality(v_qids);

  select public.save_attempt(
           c_student,
           v_attempt,
           62,     -- just past the break
           5400,   -- 90 minutes left of 150
           pg_temp.answer_payload(v_qids, 44, v_n - 63),
           '[58]'::jsonb
         )
    into v_result;
  if v_result <> 'ok' then
    raise exception 'seed_demo: save_attempt on exam 44 returned %', v_result;
  end if;

  if not exists (
    select 1 from public.offered_breaks
     where attempt_id = v_attempt and show_at_index = 58
  ) then
    raise exception 'seed_demo: the break at index 58 was not recorded for exam 44';
  end if;
  raise notice 'seed_demo: RMP exam 44 -> in-progress at index 62, break 58 offered';

  -- =================================================================
  -- 4. RMP Full exam, completed with a fail.
  --    Below the 75.00 threshold on purpose: config 3 sets
  --    allow_retry_wrong, so this is the attempt that gives the
  --    reviewer a revision session to open.
  -- =================================================================
  select s.id, s.question_ids_snapshot
    into v_attempt, v_qids
    from public.start_attempt(c_student, 45::smallint) s;

  if v_attempt is null then
    raise exception 'seed_demo: start_attempt returned no attempt for exam 45';
  end if;
  v_n := cardinality(v_qids);

  select public.submit_attempt(
           c_student,
           v_attempt,
           v_n - 1,
           240,
           pg_temp.answer_payload(v_qids, floor(v_n * 0.58)::integer, 6)
         )
    into v_result;
  if v_result <> 'ok' then
    raise exception 'seed_demo: submit_attempt on exam 45 returned %', v_result;
  end if;

  select score, status into v_score, v_status
    from public.exam_attempts where id = v_attempt;
  if v_status <> 'fail' then
    raise exception 'seed_demo: exam 45 was meant to fail, scored % (%)', v_score, v_status;
  end if;

  -- The revision set is what the failing attempt exists to demonstrate.
  --
  -- revision_question_ids returns ONE row holding an array, so counting rows
  -- would say 1 whatever happened - including on a 'forbidden' refusal, whose
  -- row is just as present. Read the sentinel and the array length instead.
  select r.result, coalesce(cardinality(r.question_ids), 0)
    into v_result, v_revision
    from public.revision_question_ids(c_student, v_attempt) r;

  if v_result <> 'ok' then
    raise exception 'seed_demo: revision_question_ids for exam 45 returned %', v_result;
  end if;
  if v_revision = 0 then
    raise exception 'seed_demo: exam 45 failed but offers no revision questions';
  end if;
  if v_revision <> (select wrong_questions from public.exam_attempts where id = v_attempt) then
    raise exception 'seed_demo: revision set (%) disagrees with wrong_questions (%)',
      v_revision, (select wrong_questions from public.exam_attempts where id = v_attempt);
  end if;
  raise notice 'seed_demo: RMP exam 45 -> % (%), % question(s) to revise',
    v_score, v_status, v_revision;
end $$;


-- ---------------------------------------------------------------------
-- What the reviewer should find. Fails loudly rather than leaving a
-- demo that is quietly missing a case.
-- ---------------------------------------------------------------------
do $$
declare
  c_student constant uuid := '22222222-2222-4222-8222-222222222222';
  v_answers integer;
  v_states  text;
  v_tracks  integer;
begin
  select count(*) into v_answers
    from public.attempt_answers r
    join public.exam_attempts a on a.id = r.attempt_id
   where a.user_id = c_student;

  if v_answers = 0 then
    raise exception 'seed_demo: no attempt_answers rows - every review screen would be empty';
  end if;

  select count(distinct x.track_id) into v_tracks
    from public.exam_attempts a
    join public.exams x on x.id = a.exam_id
   where a.user_id = c_student;

  if v_tracks < 2 then
    raise exception 'seed_demo: attempts cover % track(s), expected both', v_tracks;
  end if;

  select string_agg(distinct coalesce(a.status, a.exam_state), ', ' order by coalesce(a.status, a.exam_state))
    into v_states
    from public.exam_attempts a
   where a.user_id = c_student;

  raise notice 'seed_demo: % answer row(s) for student@local.test across % track(s); states: %',
    v_answers, v_tracks, v_states;
end $$;
