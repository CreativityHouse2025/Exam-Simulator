-- =============================================================================
-- 025 — PMP categories, and the existing exams that return to the catalog.
--
-- Category exams and the full exams' case studies arrive with the generated
-- content migration.
-- =============================================================================

BEGIN;

-- 1. PMP categories, in Categories page order.
INSERT INTO public.tags (code, track_id, display_order, name_en, name_ar, color_hex_code)
VALUES
  ('people',      '33333333-3333-4333-8333-333333333333', 1, 'People',                  'الأفراد',                 '#2f6f9a'),
  ('process',     '33333333-3333-4333-8333-333333333333', 2, 'Process',                 'العمليات',                '#2f8a5b'),
  ('environment', '33333333-3333-4333-8333-333333333333', 3, 'Business Environment',    'بيئة العمل',            '#b5562d'),
  ('casestudies', '33333333-3333-4333-8333-333333333333', 4, 'Case Studies',            'دراسات الحالة',           '#5a5f9e'),
  ('agile',       '33333333-3333-4333-8333-333333333333', 5, 'Agile Methodology',       'المنهجية المرنة (أجايل)', '#a0832b'),
  ('ai',          '33333333-3333-4333-8333-333333333333', 6, 'Artificial Intelligence', 'الذكاء الاصطناعي',        '#3a8a8a');

-- legacy is archived; it moves out of the way of order 1.
UPDATE public.tags SET display_order = 7 WHERE code = 'legacy';


-- 2. AI Questions becomes the AI category's only exam.
UPDATE public.exams
SET tag_id        = (SELECT id FROM public.tags WHERE code = 'ai'),
    display_order = 1,
    archived_at   = NULL
WHERE id = 43;


-- 3. Kept full exams: PMP Aug 2026, PMP Core 2026, PMI Exam 3, ECO 1, ECO 2.
UPDATE public.exams SET archived_at = NULL WHERE id IN (17, 16, 15, 12, 13);

COMMIT;
