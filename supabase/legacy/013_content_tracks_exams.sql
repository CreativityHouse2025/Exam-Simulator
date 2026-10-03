-- =============================================================================
-- Migration 013: track / exam catalogue content
--
-- Moved verbatim out of supabase/seed_tracks.sql (see spec-add-tracks-api.md
-- 11.0). This is content, not test data, and it has to be a migration for two
-- reasons:
--
--   1. 016's config_snapshot backfill joins public.exams and public.exam_config.
--      Seeds run AFTER migrations, so with these rows in a seed the backfill
--      matches nothing and its SET NOT NULL fails on any database that already
--      holds attempts. It only appeared to work locally because exam_attempts
--      is empty at that point.
--   2. exam_questions (014) references public.exams (id). A seed cannot satisfy
--      a foreign key declared by a migration.
--
-- seed_tracks.sql keeps only its enrollments block, which is test data: it
-- enrolls the fake users created by seed.sql.
--
-- question_count values here are the ones inherited from the JSON banks. 015
-- reconciles them against the exam_questions rows that actually exist — eight
-- questions are excluded (see the block at the top of the spec), so three exams
-- end up smaller than the number written below.
-- =============================================================================


-- ---------------------------------------------------------------------
-- track
-- ---------------------------------------------------------------------
insert into public.tracks (id, name_ar, name_en, description_ar, description_en, enrollment_duration_days)
values
  ('33333333-3333-4333-8333-333333333333', 'محترف إدارة المشاريع (PMP)', 'PMP', 'مسار التدريب على شهادة محترف إدارة المشاريع.', 'Project Management Professional certification practice track.', 180)
on conflict (id) do nothing;


-- ---------------------------------------------------------------------
-- exam_type (from src/data/exam/exam-types.json)
-- ---------------------------------------------------------------------
insert into public.exam_type (id, name_ar, name_en, colour)
values
  (1, 'امتحان كامل', 'Full Exam', 'primary'),
  (2, 'امتحان مجال (مصنف)', 'Domain Exam', 'secondary')
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.exam_type', 'id'), coalesce((select max(id) from public.exam_type), 1));


-- ---------------------------------------------------------------------
-- exam_config - one per exam type, both owned by the PMP track
-- ---------------------------------------------------------------------
insert into public.exam_config (id, name_ar, name_en, exam_duration_minutes, passing_rate, can_reveal_answers, allow_retry_wrong)
values
  (1, 'امتحان PMP الكامل', 'PMP Full Exam', 240, 75.00, false, true),
  (2, 'امتحان PMP المصنف', 'PMP Domain Exam', 300, 85.00, true, false)
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.exam_config', 'id'), coalesce((select max(id) from public.exam_config), 1));


-- ---------------------------------------------------------------------
-- allowed_config - the PMP track may run both configs
-- ---------------------------------------------------------------------
insert into public.allowed_config (track_id, config_id)
values
  ('33333333-3333-4333-8333-333333333333', 1),
  ('33333333-3333-4333-8333-333333333333', 2)
on conflict (track_id, config_id) do nothing;


-- ---------------------------------------------------------------------
-- breaks - inserted before exams so breaks_check_index sees no exam yet;
-- exams_check_break_index then validates every exam against these rows.
-- ---------------------------------------------------------------------
insert into public.breaks (config_id, show_at_index, duration_minutes)
values
  (1, 60, 10),
  (1, 120, 10)
on conflict (config_id, show_at_index) do nothing;


-- ---------------------------------------------------------------------
-- exams - ids match src/data/exam/<lang>/<id>.json (42 exams)
-- display_order preserves the order exams.json lists them in.
-- ---------------------------------------------------------------------
insert into public.exams (id, track_id, config_id, type_id, display_order, name_ar, name_en, description_ar, description_en, question_count)
values
  (17, '33333333-3333-4333-8333-333333333333', 1, 1, 1, 'اختبار PMP Aug 2026', 'PMP Aug 2026', 'امتحان PMP تجريبي كامل: اختبار PMP Aug 2026.', 'Full-length PMP practice exam: PMP Aug 2026.', 178),
  (16, '33333333-3333-4333-8333-333333333333', 1, 1, 2, 'اختبار PMP Core 2026', 'PMP Core 2026', 'امتحان PMP تجريبي كامل: اختبار PMP Core 2026.', 'Full-length PMP practice exam: PMP Core 2026.', 185),
  (10, '33333333-3333-4333-8333-333333333333', 1, 1, 3, 'اختبار PMI 1', 'PMI Exam 1', 'امتحان PMP تجريبي كامل: اختبار PMI 1.', 'Full-length PMP practice exam: PMI Exam 1.', 180),
  (14, '33333333-3333-4333-8333-333333333333', 1, 1, 4, 'اختبار PMI 2', 'PMI Exam 2', 'امتحان PMP تجريبي كامل: اختبار PMI 2.', 'Full-length PMP practice exam: PMI Exam 2.', 180),
  (15, '33333333-3333-4333-8333-333333333333', 1, 1, 5, 'اختبار PMI 3', 'PMI Exam 3', 'امتحان PMP تجريبي كامل: اختبار PMI 3.', 'Full-length PMP practice exam: PMI Exam 3.', 180),
  (12, '33333333-3333-4333-8333-333333333333', 1, 1, 6, 'اختبار PMP ECO الكامل 1', 'PMP Full Exam ECO 1', 'امتحان PMP تجريبي كامل: اختبار PMP ECO الكامل 1.', 'Full-length PMP practice exam: PMP Full Exam ECO 1.', 180),
  (13, '33333333-3333-4333-8333-333333333333', 1, 1, 7, 'اختبار PMP ECO الكامل 2', 'PMP Full Exam ECO 2', 'امتحان PMP تجريبي كامل: اختبار PMP ECO الكامل 2.', 'Full-length PMP practice exam: PMP Full Exam ECO 2.', 175),
  (1, '33333333-3333-4333-8333-333333333333', 1, 1, 8, 'اختبار PMP الكامل 1', 'PMP Full Exam 1', 'امتحان PMP تجريبي كامل: اختبار PMP الكامل 1.', 'Full-length PMP practice exam: PMP Full Exam 1.', 175),
  (2, '33333333-3333-4333-8333-333333333333', 1, 1, 9, 'اختبار PMP الكامل 2', 'PMP Full Exam 2', 'امتحان PMP تجريبي كامل: اختبار PMP الكامل 2.', 'Full-length PMP practice exam: PMP Full Exam 2.', 175),
  (3, '33333333-3333-4333-8333-333333333333', 1, 1, 10, 'اختبار PMP الكامل 3', 'PMP Full Exam 3', 'امتحان PMP تجريبي كامل: اختبار PMP الكامل 3.', 'Full-length PMP practice exam: PMP Full Exam 3.', 175),
  (4, '33333333-3333-4333-8333-333333333333', 1, 1, 11, 'اختبار PMP الكامل 4', 'PMP Full Exam 4', 'امتحان PMP تجريبي كامل: اختبار PMP الكامل 4.', 'Full-length PMP practice exam: PMP Full Exam 4.', 175),
  (5, '33333333-3333-4333-8333-333333333333', 1, 1, 12, 'اختبار PMP الكامل 5', 'PMP Full Exam 5', 'امتحان PMP تجريبي كامل: اختبار PMP الكامل 5.', 'Full-length PMP practice exam: PMP Full Exam 5.', 175),
  (6, '33333333-3333-4333-8333-333333333333', 1, 1, 13, 'اختبار PMP التجريبي 1', 'PMP Mock Exam 1', 'امتحان PMP تجريبي كامل: اختبار PMP التجريبي 1.', 'Full-length PMP practice exam: PMP Mock Exam 1.', 181),
  (7, '33333333-3333-4333-8333-333333333333', 1, 1, 14, 'اختبار PMP التجريبي 2', 'PMP Mock Exam 2', 'امتحان PMP تجريبي كامل: اختبار PMP التجريبي 2.', 'Full-length PMP practice exam: PMP Mock Exam 2.', 181),
  (8, '33333333-3333-4333-8333-333333333333', 1, 1, 15, 'اختبار PMP التجريبي 3', 'PMP Mock Exam 3', 'امتحان PMP تجريبي كامل: اختبار PMP التجريبي 3.', 'Full-length PMP practice exam: PMP Mock Exam 3.', 181),
  (9, '33333333-3333-4333-8333-333333333333', 1, 1, 16, 'اختبار PMP التجريبي 4', 'PMP Mock Exam 4', 'امتحان PMP تجريبي كامل: اختبار PMP التجريبي 4.', 'Full-length PMP practice exam: PMP Mock Exam 4.', 181),
  (43, '33333333-3333-4333-8333-333333333333', 2, 2, 17, 'أسئلة الذكاء الاصطناعي', 'AI Questions', 'أسئلة تدريبية في مجال أسئلة الذكاء الاصطناعي.', 'Practice questions for the AI Questions domain.', 10),
  (42, '33333333-3333-4333-8333-333333333333', 2, 2, 18, 'دراسات حالة', 'Case Studies', 'أسئلة تدريبية في مجال دراسات حالة.', 'Practice questions for the Case Studies domain.', 18),
  (18, '33333333-3333-4333-8333-333333333333', 2, 2, 19, 'الميزانية', 'Budget', 'أسئلة تدريبية في مجال الميزانية.', 'Practice questions for the Budget domain.', 46),
  (19, '33333333-3333-4333-8333-333333333333', 2, 2, 20, 'بناء مشترك', 'Building Shared', 'أسئلة تدريبية في مجال بناء مشترك.', 'Practice questions for the Building Shared domain.', 21),
  (20, '33333333-3333-4333-8333-333333333333', 2, 2, 21, 'التواصل', 'Communication', 'أسئلة تدريبية في مجال التواصل.', 'Practice questions for the Communication domain.', 16),
  (21, '33333333-3333-4333-8333-333333333333', 2, 2, 22, 'قيادة فريق', 'Leading A Team', 'أسئلة تدريبية في مجال قيادة فريق.', 'Practice questions for the Leading A Team domain.', 58),
  (22, '33333333-3333-4333-8333-333333333333', 2, 2, 23, 'التغييرات التنظيمية', 'Organizational Changes', 'أسئلة تدريبية في مجال التغييرات التنظيمية.', 'Practice questions for the Organizational Changes domain.', 21),
  (23, '33333333-3333-4333-8333-333333333333', 2, 2, 24, 'الجودة', 'Quality', 'أسئلة تدريبية في مجال الجودة.', 'Practice questions for the Quality domain.', 44),
  (24, '33333333-3333-4333-8333-333333333333', 2, 2, 25, 'الموارد', 'Resources', 'أسئلة تدريبية في مجال الموارد.', 'Practice questions for the Resources domain.', 22),
  (25, '33333333-3333-4333-8333-333333333333', 2, 2, 26, 'المخاطر', 'Risk', 'أسئلة تدريبية في مجال المخاطر.', 'Practice questions for the Risk domain.', 94),
  (26, '33333333-3333-4333-8333-333333333333', 2, 2, 27, 'النطاق', 'Scope', 'أسئلة تدريبية في مجال النطاق.', 'Practice questions for the Scope domain.', 35),
  (27, '33333333-3333-4333-8333-333333333333', 2, 2, 28, 'الجدول الزمني', 'Schedule', 'أسئلة تدريبية في مجال الجدول الزمني.', 'Practice questions for the Schedule domain.', 47),
  (28, '33333333-3333-4333-8333-333333333333', 2, 2, 29, 'أصحاب المصلحة (المعنيين)', 'Stakeholders', 'أسئلة تدريبية في مجال أصحاب المصلحة (المعنيين).', 'Practice questions for the Stakeholders domain.', 18),
  (29, '33333333-3333-4333-8333-333333333333', 2, 2, 30, 'المشتريات', 'Procurement', 'أسئلة تدريبية في مجال المشتريات.', 'Practice questions for the Procurement domain.', 50),
  (30, '33333333-3333-4333-8333-333333333333', 2, 2, 31, 'الامتثال', 'Compliance', 'أسئلة تدريبية في مجال الامتثال.', 'Practice questions for the Compliance domain.', 25),
  (31, '33333333-3333-4333-8333-333333333333', 2, 2, 32, 'التغييرات الخارجية', 'External Changes', 'أسئلة تدريبية في مجال التغييرات الخارجية.', 'Practice questions for the External Changes domain.', 17),
  (32, '33333333-3333-4333-8333-333333333333', 2, 2, 33, 'الإغلاق', 'Closure Transition', 'أسئلة تدريبية في مجال الإغلاق.', 'Practice questions for the Closure Transition domain.', 18),
  (33, '33333333-3333-4333-8333-333333333333', 2, 2, 34, 'عناصر العمل', 'Artifacts', 'أسئلة تدريبية في مجال عناصر العمل.', 'Practice questions for the Artifacts domain.', 27),
  (34, '33333333-3333-4333-8333-333333333333', 2, 2, 35, 'التغييرات', 'Changes', 'أسئلة تدريبية في مجال التغييرات.', 'Practice questions for the Changes domain.', 42),
  (35, '33333333-3333-4333-8333-333333333333', 2, 2, 36, 'التعاون مع أصحاب المصلحة', 'Collaborating with Stakeholders', 'أسئلة تدريبية في مجال التعاون مع أصحاب المصلحة.', 'Practice questions for the Collaborating with Stakeholders domain.', 52),
  (36, '33333333-3333-4333-8333-333333333333', 2, 2, 37, 'تقوية أصحاب المصلحة', 'Empowering Stakeholders', 'أسئلة تدريبية في مجال تقوية أصحاب المصلحة.', 'Practice questions for the Empowering Stakeholders domain.', 15),
  (37, '33333333-3333-4333-8333-333333333333', 2, 2, 38, 'إدارة النزاعات', 'Managing Conflicts', 'أسئلة تدريبية في مجال إدارة النزاعات.', 'Practice questions for the Managing Conflicts domain.', 17),
  (38, '33333333-3333-4333-8333-333333333333', 2, 2, 39, 'المنهجية', 'Methodology', 'أسئلة تدريبية في مجال المنهجية.', 'Practice questions for the Methodology domain.', 48),
  (39, '33333333-3333-4333-8333-333333333333', 2, 2, 40, 'التخطيط', 'Planning', 'أسئلة تدريبية في مجال التخطيط.', 'Practice questions for the Planning domain.', 10),
  (40, '33333333-3333-4333-8333-333333333333', 2, 2, 41, 'القيمة', 'Value', 'أسئلة تدريبية في مجال القيمة.', 'Practice questions for the Value domain.', 37),
  (41, '33333333-3333-4333-8333-333333333333', 2, 2, 42, 'المنهجية المرنة (أجايل)', 'Agile', 'أسئلة تدريبية في مجال المنهجية المرنة (أجايل).', 'Practice questions for the Agile domain.', 200)
on conflict (id) do nothing;

select setval(pg_get_serial_sequence('public.exams', 'id'), coalesce((select max(id) from public.exams), 1));
select setval(pg_get_serial_sequence('public.exams', 'display_order'), coalesce((select max(display_order) from public.exams), 1));
