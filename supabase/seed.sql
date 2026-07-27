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

insert into public.users (id, first_name, last_name, expires_at, role)
values
  ('c9e8f071-9a48-4798-8e80-23e3a3a43917', 'Amira',   'Hassan',   now() + interval '30 days', 'student'),
  ('d88a3314-3ffa-4e66-bfac-0754be02b379', 'Omar',    'Khalil',   now() + interval '30 days', 'student'),
  ('05b0aae0-61df-47de-8714-79f9c55b72f4', 'Sara',    'Ibrahim',  now() + interval '30 days', 'student'),
  ('4f475484-3398-4437-959f-1342d8e8303a', 'Youssef', 'Adel',     now() + interval '30 days', 'student'),
  ('b03c5dae-42b5-4bb6-a0d2-5283588741d7', 'Layla',   'Mostafa',  now() + interval '30 days', 'student'),
  ('9ad8a618-45b1-41d7-b321-501d799480ac', 'Karim',   'Said',     now() + interval '30 days', 'student'),
  ('6334ded8-addc-4c28-a1f2-513af182dd79', 'Nour',    'Fathy',    now() + interval '30 days', 'student'),
  ('a0d45d1e-5c0a-414c-92e3-1cdafcfba337', 'Mohamed', 'Ali',      now() + interval '30 days', 'student'),
  ('6672d13d-31e2-49c0-b30d-b947f44d6e40', 'Dina',    'Mahmoud',  now() + interval '30 days', 'student'),
  ('91e9a4fe-9760-4900-a46f-03ceb3559f4c', 'Tarek',   'Nabil',    now() + interval '30 days', 'student')
on conflict (id) do nothing;

-- 3 attempts per student: one completed pass, one completed fail, one in-progress.
insert into public.exam_attempts (user_id, exam_type, exam_id, category_id, exam_state, status, score, time_remaining, created_at)
select
  u.id,
  a.exam_type,
  a.exam_id,
  a.category_id,
  a.exam_state,
  a.status,
  a.score,
  a.time_remaining,
  now() - a.age
from public.users u
cross join (
  values
    ('full',   1, null::int, 'completed',   'pass', 78.50,    0, interval '10 days'),
    ('domain', null::int, 2, 'completed',   'fail', 55.00,    0, interval '5 days'),
    ('full',   1, null::int, 'in-progress', null,    0.00, 3600, interval '1 day')
) as a(exam_type, exam_id, category_id, exam_state, status, score, time_remaining, age)
where u.role = 'student';
