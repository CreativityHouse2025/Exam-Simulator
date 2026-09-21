-- Test-data enrollments for the accounts seed.sql creates.
--
-- The track / exam_type / exam_config / breaks / allowed_config / exams rows
-- these depend on are content, not test data, and live in migrations
-- 011_content_catalogue.sql and 017_rmp_content.sql.
--
-- Runs after seed.sql because it enrolls the users that file creates, and
-- before seed_demo.sql because an attempt is only meaningful for an enrolled
-- user.
--
-- Three enrollment shapes are represented on purpose:
--
--   active, one track    the ten demo students — the ordinary case
--   active, both tracks  the two local@ accounts — the multi-track UI
--   expired              tarek.nabil — the locked-out case
--
-- tarek.nabil gets the expired row INSTEAD OF an active one, not in addition.
-- enrollments_no_overlap is an exclusion constraint over
-- tstzrange(created_at, expires_at) per (user_id, track_id), so a past
-- enrollment and a current one for the same track cannot coexist unless the
-- ranges are disjoint. Giving him both would abort this file.
--
-- EVERY STATEMENT NAMES ITS OWN ACCOUNTS rather than selecting from
-- public.users. On a local reset those are the same set, but a deployed
-- environment already holds users that migration 015 enrolled from their old
-- users.expires_at. An unfiltered INSERT would hand a fresh 180-day enrollment
-- to any of them whose backfilled one had already lapsed — the exclusion
-- constraint only absorbs the ones that are still active — and this seed would
-- be rewriting data it did not create.
--
-- The lists are repeated inline rather than held in a temporary table: the
-- Supabase CLI seeder sends this file in batches and a temp relation does not
-- survive between them.

-- ---------------------------------------------------------------------
-- PMP - every seeded account except tarek.nabil, who is expired below
-- ---------------------------------------------------------------------
insert into public.enrollments (user_id, track_id, created_at, expires_at)
select s.id,
       t.id,
       now(),
       now() + make_interval(days => t.enrollment_duration_days)
  from (values
          ('c9e8f071-9a48-4798-8e80-23e3a3a43917'::uuid),  -- amira.hassan
          ('d88a3314-3ffa-4e66-bfac-0754be02b379'::uuid),  -- omar.khalil
          ('05b0aae0-61df-47de-8714-79f9c55b72f4'::uuid),  -- sara.ibrahim
          ('4f475484-3398-4437-959f-1342d8e8303a'::uuid),  -- youssef.adel
          ('b03c5dae-42b5-4bb6-a0d2-5283588741d7'::uuid),  -- layla.mostafa
          ('9ad8a618-45b1-41d7-b321-501d799480ac'::uuid),  -- karim.said
          ('6334ded8-addc-4c28-a1f2-513af182dd79'::uuid),  -- nour.fathy
          ('a0d45d1e-5c0a-414c-92e3-1cdafcfba337'::uuid),  -- mohamed.ali
          ('6672d13d-31e2-49c0-b30d-b947f44d6e40'::uuid),  -- dina.mahmoud, no attempts
          ('11111111-1111-4111-8111-111111111111'::uuid),  -- supervisor@local.test
          ('22222222-2222-4222-8222-222222222222'::uuid)   -- student@local.test
       ) as s(id)
  cross join public.tracks t
 where t.id = '33333333-3333-4333-8333-333333333333'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- RMP - the two memorable local accounts only
--
-- These are the accounts a reviewer signs in as, so both carry every track:
-- the student to see a two-track library and switch between them, the
-- supervisor to browse both catalogues.
-- ---------------------------------------------------------------------
insert into public.enrollments (user_id, track_id, created_at, expires_at)
select s.id,
       t.id,
       now(),
       now() + make_interval(days => t.enrollment_duration_days)
  from (values
          ('11111111-1111-4111-8111-111111111111'::uuid),  -- supervisor@local.test
          ('22222222-2222-4222-8222-222222222222'::uuid)   -- student@local.test
       ) as s(id)
  cross join public.tracks t
 where t.id = '44444444-4444-4444-8444-444444444444'
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Expired - tarek.nabil, PMP, lapsed 20 days ago
-- ---------------------------------------------------------------------
insert into public.enrollments (user_id, track_id, created_at, expires_at)
values (
  '91e9a4fe-9760-4900-a46f-03ceb3559f4c',
  '33333333-3333-4333-8333-333333333333',
  now() - interval '200 days',
  now() - interval '20 days'
)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- Prove the three shapes exist. A silently-skipped insert here leaves the
-- demo missing a case the client was told to look at.
--
-- SCOPED TO THE SEEDED ACCOUNTS, and the two interesting cases are asserted
-- by name. A deployed database already holds enrollments that migration 015
-- backfilled, some of them expired; a table-wide count would measure that
-- backfill instead of this seed, and an expired row belonging to somebody
-- else would satisfy the check by accident.
-- ---------------------------------------------------------------------
do $$
declare
  c_pmp        constant uuid := '33333333-3333-4333-8333-333333333333';
  c_rmp        constant uuid := '44444444-4444-4444-8444-444444444444';
  c_tarek      constant uuid := '91e9a4fe-9760-4900-a46f-03ceb3559f4c';
  c_student    constant uuid := '22222222-2222-4222-8222-222222222222';
  c_supervisor constant uuid := '11111111-1111-4111-8111-111111111111';
  c_seeded     constant uuid[] := array[
    'c9e8f071-9a48-4798-8e80-23e3a3a43917',
    'd88a3314-3ffa-4e66-bfac-0754be02b379',
    '05b0aae0-61df-47de-8714-79f9c55b72f4',
    '4f475484-3398-4437-959f-1342d8e8303a',
    'b03c5dae-42b5-4bb6-a0d2-5283588741d7',
    '9ad8a618-45b1-41d7-b321-501d799480ac',
    '6334ded8-addc-4c28-a1f2-513af182dd79',
    'a0d45d1e-5c0a-414c-92e3-1cdafcfba337',
    '6672d13d-31e2-49c0-b30d-b947f44d6e40',
    '91e9a4fe-9760-4900-a46f-03ceb3559f4c',
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222'
  ]::uuid[];

  v_active  integer;
  v_expired integer;
  v_multi   integer;
begin
  select count(*) into v_active
    from public.enrollments
   where user_id = any (c_seeded) and expires_at > now();

  select count(*) into v_expired
    from public.enrollments
   where user_id = any (c_seeded) and expires_at <= now();

  select count(*) into v_multi
    from (select user_id
            from public.enrollments
           where user_id = any (c_seeded) and expires_at > now()
           group by user_id
          having count(distinct track_id) = 2) x;

  -- The locked-out case: one lapsed enrollment and no active one anywhere.
  if v_expired <> 1 then
    raise exception
      'seed_tracks: expected exactly 1 expired enrollment among the seeded accounts, found %',
      v_expired;
  end if;
  if not exists (
    select 1 from public.enrollments
     where user_id = c_tarek and track_id = c_pmp and expires_at <= now()
  ) then
    raise exception 'seed_tracks: tarek.nabil has no expired PMP enrollment';
  end if;
  if exists (
    select 1 from public.enrollments
     where user_id = c_tarek and expires_at > now()
  ) then
    raise exception
      'seed_tracks: tarek.nabil is meant to be locked out but holds an active enrollment';
  end if;

  -- The multi-track case.
  if v_multi <> 2 then
    raise exception 'seed_tracks: expected 2 seeded accounts on both tracks, found %', v_multi;
  end if;
  if not exists (
    select 1 from public.enrollments
     where user_id = c_student and track_id = c_rmp and expires_at > now()
  ) then
    raise exception 'seed_tracks: student@local.test is not enrolled in RMP';
  end if;
  if not exists (
    select 1 from public.enrollments
     where user_id = c_supervisor and track_id = c_rmp and expires_at > now()
  ) then
    raise exception 'seed_tracks: supervisor@local.test is not enrolled in RMP';
  end if;

  raise notice
    'seed_tracks: % active enrollment(s), % expired, % on both tracks (seeded accounts only)',
    v_active, v_expired, v_multi;
end $$;
