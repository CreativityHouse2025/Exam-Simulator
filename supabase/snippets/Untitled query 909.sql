select
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  r.rolname as grantee,
  a.privilege_type
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join lateral aclexplode(
  coalesce(p.proacl, acldefault('f', p.proowner))
) as a
join pg_roles r on r.oid = a.grantee
where n.nspname = 'public'
  and r.rolname in ('anon', 'authenticated', 'service_role', 'postgres')
  and not exists (
    select 1 from pg_depend d
    where d.objid = p.oid
      and d.deptype = 'e'   -- 'e' = owned by an extension
  )
order by function_name, grantee;