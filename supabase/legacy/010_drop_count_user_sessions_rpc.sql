-- Single-session enforcement moved to Supabase Auth ("Single session per user" in the
-- project's auth settings), so nothing calls this RPC any more. Drop it rather than leave a
-- security definer function that can read auth.sessions with no caller.

DROP FUNCTION IF EXISTS public.count_user_sessions(uuid);
