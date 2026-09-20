# TODO

## Single-session enforcement cutover (Supabase-side)

Backend enforcement was removed from the codebase; the one-active-session limit is now expected to
come from Supabase Auth. **Until step 1 is done there is no enforcement at all** — nothing in the
code checks session count any more.

Order matters. Step 4 before step 3 takes production sign-in down.

- [ ] **1. Enable "Single session per user"** — Supabase dashboard → Auth → Sessions. Pro plan
      feature. Do this for every project the app uses (production and any staging project); the
      setting is per-project and is not in version control.
- [ ] **2. Set JWT expiry to 30m** — Project Settings → JWT Keys. Supabase only checks the session
      limit when a session refreshes, and `withAuth` verifies access tokens locally, so a
      terminated session keeps working until its access token expires. This setting is the only
      thing that bounds that window.
- [ ] **3. Deploy backend and frontend together.** `SigninRequestSchema` is a `strictObject` and no
      longer accepts `force`; a stale frontend bundle still sending it gets `VALIDATION_ERROR` on
      every sign-in.
- [ ] **4. Apply `supabase/migrations/010_drop_count_user_sessions_rpc.sql`** — only after step 3.
      The previously deployed backend calls `count_user_sessions` and fails closed on RPC error, so
      dropping the function while that code is live breaks sign-in for everyone.
      Rollback: re-apply `002_count_user_sessions_rpc.sql` (plain `CREATE OR REPLACE`).
- [ ] **5. Regenerate `api/_lib/database.types.ts`** after step 4 and commit. It still carries a
      `count_user_sessions` entry, which stays correct until the function is actually dropped.
- [ ] **6. Update** user creation trigger in production to remove creating expires_at.
- [ ] **7. Move** offered breaks showed at from frontend to now() in the backend. 

### Expected behaviour change

Newest sign-in wins, silently. A student displaced by a second sign-in gets no message — they hit a
401 and land on the sign-in page, up to the JWT expiry later, possibly mid-exam. Exam progress is
client-side so answers survive, but the attempt-save call fails first. Previously the *second*
sign-in was blocked with `SESSION_CONFLICT` and the first device was untouched.
