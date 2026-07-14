-- Adds role-based access control: a `role` enum on public.users.
-- Existing rows get `student` via DEFAULT — no manual backfill needed.
CREATE TYPE public.user_role AS ENUM ('student', 'supervisor');

ALTER TABLE public.users
  ADD COLUMN role public.user_role NOT NULL DEFAULT 'student';
