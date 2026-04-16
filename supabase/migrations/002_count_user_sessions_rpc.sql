CREATE OR REPLACE FUNCTION public.count_user_sessions(p_user_id uuid)
RETURNS integer
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT count(*)::integer
  FROM auth.sessions
  WHERE user_id = p_user_id;
$$;

REVOKE EXECUTE ON FUNCTION public.count_user_sessions(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_user_sessions(uuid) FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.count_user_sessions(uuid) TO service_role;