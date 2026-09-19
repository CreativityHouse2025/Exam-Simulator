-- Test-data enrollments: every user created by seed.sql, enrolled in the PMP
-- track for its full duration.
--
-- The track / exam_type / exam_config / breaks / allowed_config / exams rows
-- this depends on are NOT here any more — they are content and live in
-- supabase/migrations/013_content_tracks_exams.sql. See spec-add-tracks-api.md
-- 11.0.
--
-- Runs after seed.sql because it enrolls the users that file creates.

-- ---------------------------------------------------------------------
-- enrollments - every seeded user, for the track's full duration
-- ---------------------------------------------------------------------
insert into public.enrollments (user_id, track_id, expires_at)
select u.id, t.id, now() + make_interval(days => t.enrollment_duration_days)
  from public.users u
  cross join public.tracks t
 where t.id = '33333333-3333-4333-8333-333333333333'
on conflict do nothing;
