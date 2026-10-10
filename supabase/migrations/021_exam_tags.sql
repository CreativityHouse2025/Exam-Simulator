-- =============================================================================
-- 021 — Exam types become tags.
--
-- A tag says where an exam is listed: the shared full tag under "Full exams",
-- a track's domain tags under "Domains". The API and URLs address a tag by code.
-- =============================================================================

BEGIN;

-- 1. Rename. RLS, grants (016), the exams FK and the updated_at trigger carry over.
ALTER TABLE public.exam_type RENAME TO tags;
ALTER TABLE public.tags RENAME COLUMN colour TO color_hex_code;
ALTER TABLE public.exams RENAME COLUMN type_id TO tag_id;
ALTER TABLE public.exams RENAME CONSTRAINT exams_type_id_fkey TO exams_tag_id_fkey;
ALTER TRIGGER set_exam_type_updated_at ON public.tags RENAME TO set_tags_updated_at;


-- 2. New columns, nullable until backfilled.
ALTER TABLE public.tags
  ADD COLUMN code          TEXT,
  -- NULL means shared across tracks.
  ADD COLUMN track_id      UUID REFERENCES public.tracks (id) ON DELETE RESTRICT,
  ADD COLUMN display_order SMALLINT;


-- 3. Backfill. legacy is never linked from the UI.
UPDATE public.tags SET code = 'full',   track_id = NULL,                                   display_order = 0, color_hex_code = '#9a6b2f', name_en = 'Full Exams', name_ar = 'الامتحانات الكاملة' WHERE id = 1;
UPDATE public.tags SET code = 'legacy', track_id = '33333333-3333-4333-8333-333333333333', display_order = 1, color_hex_code = '#7b4d8e' WHERE id = 2;


-- 4. Lock it down.
ALTER TABLE public.tags
  ALTER COLUMN code          SET NOT NULL,
  ALTER COLUMN display_order SET NOT NULL,
  ADD CONSTRAINT tags_code_key UNIQUE (code),
  ADD CONSTRAINT chk_tags_code   CHECK (code ~ '^[a-z0-9]+$'),
  ADD CONSTRAINT chk_tags_color_hex_code CHECK (color_hex_code ~ '^#[0-9A-Fa-f]{6}$'),
  -- Deferred so a reorder can swap values inside one transaction.
  ADD CONSTRAINT tags_track_id_display_order_key UNIQUE (track_id, display_order)
    DEFERRABLE INITIALLY DEFERRED;


-- 5. Exam order is per (track, tag). New content sets it explicitly.
ALTER TABLE public.exams
  ALTER COLUMN display_order DROP IDENTITY,
  DROP CONSTRAINT exams_track_id_display_order_key;

-- Renumber from 1 inside each (track, tag), keeping today's relative order.
UPDATE public.exams AS e
SET display_order = ranked.position
FROM (
  SELECT id, row_number() OVER (PARTITION BY track_id, tag_id ORDER BY display_order, id) AS position
  FROM public.exams
) AS ranked
WHERE e.id = ranked.id;

ALTER TABLE public.exams
  -- Deferred so a reorder can swap values inside one transaction.
  ADD CONSTRAINT exams_track_id_tag_id_display_order_key UNIQUE (track_id, tag_id, display_order)
    DEFERRABLE INITIALLY DEFERRED;

COMMIT;
