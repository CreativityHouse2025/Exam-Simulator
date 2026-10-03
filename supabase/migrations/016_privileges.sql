-- =============================================================================
-- Migration 016: lock the public schema to service_role
--
-- The frontend never talks to Supabase directly. Every read and write goes
-- through a Vercel serverless function holding the secret key, so the Data API
-- needs to be reachable by service_role and by nobody else.
--
-- Two layers, enforced separately because either one alone leaks:
--
--   TABLES  RLS enabled with NO policies, and no grants to anon/authenticated.
--           RLS alone would be enough while it is on, but a table is one
--           `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` away from being world
--           readable if the grants are still sitting there. Both are removed.
--
--   ROUTINES  Every SECURITY DEFINER function revoked from anon and
--           authenticated, then granted to service_role one at a time. A
--           definer function ignores RLS by design, so a stray EXECUTE grant
--           on one of these is a complete bypass of the layer above.
--
-- WHY THIS IS NOT ALREADY TRUE. Production and staging carry
--
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     GRANT DELETE, INSERT, SELECT, UPDATE ON TABLES TO anon, authenticated;
--   ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
--     GRANT ALL ON ROUTINES TO anon, authenticated;
--
-- so every table and function these migrations create is handed to anon the
-- moment it exists. What has been saving it is an event trigger, rls_auto_enable,
-- which enables RLS on each new table in public.
--
-- SCOPE: THIS MIGRATION NAMES ITS OWN OBJECTS AND TOUCHES NOTHING ELSE.
--
-- It does not reverse the default privileges, and it does not alter routines
-- this repo did not create. Those defaults are part of the project's Supabase
-- configuration; a migration that quietly rewrote them would change the
-- behaviour of every future table in the schema, including ones added from the
-- dashboard by someone who never read this file. The same goes for
-- rls_auto_enable() itself, which is a dashboard-created SECURITY DEFINER
-- event trigger function carrying its own anon grant.
--
-- THE COST, STATED PLAINLY: a table or function added to public AFTER this
-- migration is handed to anon and authenticated by those defaults, and nothing
-- here will catch it. For a table that is survivable — rls_auto_enable turns
-- RLS on and, with no policies, the grant buys nothing. For a SECURITY DEFINER
-- function it is not, because a definer routine ignores RLS entirely. Every
-- migration that adds one must carry its own REVOKE, exactly as 014 does, and
-- add it to section 3 below.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- 1. Tables: RLS on, no policies, no access for anon or authenticated.
--
--    ENABLE ROW LEVEL SECURITY is idempotent and is repeated here for the
--    tables ensure_rls already covered in production — it is what makes a
--    local database match, since no such event trigger exists there.
--
--    users, exam_attempts and attempt_answers predate this set and are
--    included: they carry the same grants and the same reasoning.
--
--    service_role gets SELECT only. Writes go through the SECURITY DEFINER
--    functions in section 2, which run as their owner and do not consult these
--    grants at all.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_table TEXT;
  v_tables CONSTANT TEXT[] := ARRAY[
    'users',
    'exam_attempts',
    'attempt_answers',
    'offered_breaks',
    'tracks',
    'enrollments',
    'exams',
    'exam_type',
    'exam_config',
    'breaks',
    'allowed_config',
    'questions',
    'choices',
    'exam_questions'
  ];
BEGIN
  FOREACH v_table IN ARRAY v_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', v_table);
    EXECUTE format('GRANT SELECT ON public.%I TO service_role', v_table);
  END LOOP;
END $$;


-- ---------------------------------------------------------------------------
-- 2. Trigger and utility functions: not callable by anon or authenticated.
--
--    All six are trigger functions, so a direct call raises "trigger functions
--    can only be called as triggers" — but ALTER DEFAULT PRIVILEGES granted
--    ALL ON ROUTINES to anon, and two of them are SECURITY DEFINER. An EXECUTE
--    grant on a definer function is not something to leave lying around on the
--    strength of it currently erroring out.
--
--    Revoked from anon and authenticated only, NOT from PUBLIC.
--    create_user_profile fires from a trigger on auth.users driven by
--    supabase_auth_admin; the callable RPCs in section 3 revoke PUBLIC because
--    009 already proved that safe in production, but the signup path is not
--    the place to test whether Postgres re-checks EXECUTE at trigger-fire time.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.handle_updated_at()            FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.enforce_attempt_limit()        FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.create_user_profile()          FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.breaks_check_index()           FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.exams_check_break_index()      FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_question_answer_count()   FROM anon, authenticated;


-- ---------------------------------------------------------------------------
-- 3. Callable RPCs: re-asserted.
--
--    Each is already revoked and granted where it is defined (009, 014). This
--    block is a belt-and-braces restatement in one place, so the full list of
--    what service_role may call is readable without opening four files, and so
--    a function added later that forgets its own REVOKE is visibly missing from
--    here.
--
--    apply_answer_diff and attempt_correct_question_ids are deliberately absent
--    from the GRANT: they are internal, called only by the definer functions
--    above them, which are owned by the same role.
-- ---------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.apply_answer_diff(UUID, JSONB)                          FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.attempt_correct_question_ids(UUID)                      FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_attempt(UUID, SMALLINT)                           FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, JSONB, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB)     FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.revision_question_ids(UUID, UUID)                       FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.search_students(TEXT, INT)                              FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.start_attempt(UUID, SMALLINT)                           TO service_role;
GRANT EXECUTE ON FUNCTION public.save_attempt(UUID, UUID, INTEGER, INTEGER, JSONB, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.submit_attempt(UUID, UUID, INTEGER, INTEGER, JSONB)     TO service_role;
GRANT EXECUTE ON FUNCTION public.revision_question_ids(UUID, UUID)                       TO service_role;
GRANT EXECUTE ON FUNCTION public.search_students(TEXT, INT)                              TO service_role;


-- ---------------------------------------------------------------------------
-- 4. Prove it, for the objects this migration named and only those.
--
--    A table of ours reachable by anon, or an RPC of ours anon may call, is
--    the failure this file exists to prevent — so it fails here rather than in
--    a network tab.
--
--    Both checks are restricted to the object lists above. A dashboard-created
--    routine like rls_auto_enable() holds its own anon grant and is out of
--    scope by design: asserting over the whole schema would make this
--    migration fail on a state it deliberately does not manage.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_bad  INTEGER;
  v_list TEXT;
  v_tables CONSTANT TEXT[] := ARRAY[
    'users', 'exam_attempts', 'attempt_answers', 'offered_breaks',
    'tracks', 'enrollments', 'exams', 'exam_type', 'exam_config',
    'breaks', 'allowed_config', 'questions', 'choices', 'exam_questions'
  ];
  -- The callable RPCs from section 3. Trigger functions are absent on purpose:
  -- Postgres grants EXECUTE to PUBLIC on every function by default and
  -- has_function_privilege resolves through PUBLIC, so one would always fail
  -- this test unless section 2 revoked PUBLIC too — which it deliberately does
  -- not, to keep the signup trigger path untouched. A trigger function cannot
  -- be called directly anyway; what matters here is the set that IS callable.
  v_routines CONSTANT TEXT[] := ARRAY[
    'apply_answer_diff', 'attempt_correct_question_ids', 'start_attempt',
    'save_attempt', 'submit_attempt', 'revision_question_ids', 'search_students'
  ];
BEGIN
  SELECT count(*), string_agg(DISTINCT t.table_name, ', ' ORDER BY t.table_name)
    INTO v_bad, v_list
    FROM information_schema.role_table_grants t
   WHERE t.table_schema = 'public'
     AND t.table_name = ANY (v_tables)
     AND t.grantee IN ('anon', 'authenticated');

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Migration 016: anon/authenticated still hold grants on: %', v_list;
  END IF;

  SELECT count(*), string_agg(DISTINCT p.proname, ', ' ORDER BY p.proname)
    INTO v_bad, v_list
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = ANY (v_routines)
     AND (
           has_function_privilege('anon', p.oid, 'EXECUTE')
        OR has_function_privilege('authenticated', p.oid, 'EXECUTE')
         );

  IF v_bad > 0 THEN
    RAISE EXCEPTION
      'Migration 016: anon/authenticated can still EXECUTE security-definer function(s): %', v_list;
  END IF;

  -- Every RPC section 3 names must exist. Without this the check above passes
  -- vacuously if one is ever renamed, and the rename silently leaves the new
  -- name ungoverned.
  SELECT count(*), string_agg(r.name, ', ' ORDER BY r.name)
    INTO v_bad, v_list
    FROM unnest(v_routines) AS r(name)
   WHERE NOT EXISTS (
           SELECT 1
             FROM pg_proc p
             JOIN pg_namespace n ON n.oid = p.pronamespace
            WHERE n.nspname = 'public' AND p.proname = r.name
         );

  IF v_bad > 0 THEN
    RAISE EXCEPTION 'Migration 016: routine(s) named here do not exist: %', v_list;
  END IF;
END $$;
