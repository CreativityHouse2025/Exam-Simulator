create or replace function public.search_students(p_query text, p_limit int)
returns table (
  id         uuid,
  first_name text,
  last_name  text,
  email      text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  -- p_query arrives from the backend already lowercased and wildcard-escaped.
  select
    u.id,
    u.first_name,
    u.last_name,
    au.email::text,
    u.created_at
  from public.users u
  join auth.users au on au.id = u.id
  where u.role = 'student'
    and (
                au.email     like p_query || '%' escape '\' -- auth.users.email is already lowered by supabase
      or lower(u.first_name) like p_query || '%' escape '\'
      or lower(u.last_name)  like p_query || '%' escape '\'
    )
  order by u.first_name
  limit p_limit;
$$;

revoke execute on function public.search_students(text, int) from public, anon, authenticated;
grant  execute on function public.search_students(text, int) to service_role;