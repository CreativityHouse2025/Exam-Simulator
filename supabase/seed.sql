-- Test data for search_students RPC: 10 students + a few exam_attempts each.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', 'c9e8f071-9a48-4798-8e80-23e3a3a43917', 'authenticated', 'authenticated', 'amira.hassan@example.com',   crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'd88a3314-3ffa-4e66-bfac-0754be02b379', 'authenticated', 'authenticated', 'omar.khalil@example.com',    crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '05b0aae0-61df-47de-8714-79f9c55b72f4', 'authenticated', 'authenticated', 'sara.ibrahim@example.com',   crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '4f475484-3398-4437-959f-1342d8e8303a', 'authenticated', 'authenticated', 'youssef.adel@example.com',   crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'b03c5dae-42b5-4bb6-a0d2-5283588741d7', 'authenticated', 'authenticated', 'layla.mostafa@example.com',  crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '9ad8a618-45b1-41d7-b321-501d799480ac', 'authenticated', 'authenticated', 'karim.said@example.com',     crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '6334ded8-addc-4c28-a1f2-513af182dd79', 'authenticated', 'authenticated', 'nour.fathy@example.com',     crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', 'a0d45d1e-5c0a-414c-92e3-1cdafcfba337', 'authenticated', 'authenticated', 'mohamed.ali@example.com',    crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '6672d13d-31e2-49c0-b30d-b947f44d6e40', 'authenticated', 'authenticated', 'dina.mahmoud@example.com',   crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '91e9a4fe-9760-4900-a46f-03ceb3559f4c', 'authenticated', 'authenticated', 'tarek.nabil@example.com',    crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.users (id, first_name, last_name, role)
values
  ('c9e8f071-9a48-4798-8e80-23e3a3a43917', 'Amira',   'Hassan', 'student'),
  ('d88a3314-3ffa-4e66-bfac-0754be02b379', 'Omar',    'Khalil', 'student'),
  ('05b0aae0-61df-47de-8714-79f9c55b72f4', 'Sara',    'Ibrahim', 'student'),
  ('4f475484-3398-4437-959f-1342d8e8303a', 'Youssef', 'Adel', 'student'),
  ('b03c5dae-42b5-4bb6-a0d2-5283588741d7', 'Layla',   'Mostafa', 'student'),
  ('9ad8a618-45b1-41d7-b321-501d799480ac', 'Karim',   'Said', 'student'),
  ('6334ded8-addc-4c28-a1f2-513af182dd79', 'Nour',    'Fathy', 'student'),
  ('a0d45d1e-5c0a-414c-92e3-1cdafcfba337', 'Mohamed', 'Ali', 'student'),
  ('6672d13d-31e2-49c0-b30d-b947f44d6e40', 'Dina',    'Mahmoud', 'student'),
  ('91e9a4fe-9760-4900-a46f-03ceb3559f4c', 'Tarek',   'Nabil', 'student')
on conflict (id) do nothing;


-- Two memorable logins for local development, one per role. Password for every seeded
-- account is `password123`.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'supervisor@local.test', crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'student@local.test',    crypt('password123', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into public.users (id, first_name, last_name, role)
values
  ('11111111-1111-4111-8111-111111111111', 'Local', 'Supervisor', 'supervisor'),
  ('22222222-2222-4222-8222-222222222222', 'Local', 'Student', 'student')
on conflict (id) do nothing;

-- 3 attempts per student: one completed pass, one completed fail, one in-progress.
-- config_snapshot is a literal here rather than a join, to keep these fixtures
-- readable: exam ids 1 and 2 are both PMP Full Exams under exam_config id 1 in
-- migration 013_content_tracks_exams.sql — keep this literal in sync with that
-- row if it changes.
--
-- question_ids_snapshot IS joined, from exam_questions. It is NOT NULL and
-- non-empty by CHECK (migration 016 step 6), and the exams and question banks
-- are migrations now (013-015), so the rows are there by the time this runs.
insert into public.exam_attempts (user_id, exam_id, exam_state, status, score, time_remaining, created_at, config_snapshot, question_ids_snapshot)
select
  u.id,
  a.exam_id,
  a.exam_state,
  a.status,
  a.score,
  a.time_remaining,
  now() - a.age,
  '{
     "exam_duration_minutes": 240,
     "passing_rate": 75.00,
     "can_reveal_answers": false,
     "allow_retry_wrong": true,
     "breaks": [
       { "show_at_index": 60, "duration_minutes": 10 },
       { "show_at_index": 120, "duration_minutes": 10 }
     ]
   }'::jsonb,
  (
    select array_agg(q.question_id order by q.question_index)
      from public.exam_questions q
     where q.exam_id = a.exam_id
  )
from public.users u
cross join (
  values
    (1, 'completed',   'pass', 78.50,    0, interval '10 days'),
    (2, 'completed',   'fail', 55.00,    0, interval '5 days'),
    (1, 'in-progress', null,    0.00, 3600, interval '1 day')
) as a(exam_id, exam_state, status, score, time_remaining, age)
where u.role = 'student';
