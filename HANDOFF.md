# Backend Audit Handoff

## Context

A full audit of `api/_lib/services/attemptService.ts` was performed, targeting performance,
reliability, and crash risks specific to Supabase + PostgreSQL + Vercel serverless.

---

## What Has Been Fixed

### 1. Migration 001 — Duplicate Trigger (CRITICAL)
**File:** `supabase/migrations/001_user.sql`
The trigger `set_exam_attempts_updated_at` referenced `public.exam_attempts` before that table
existed (created in migration 003). This broke fresh deployments entirely.
**Fix:** Removed the orphaned trigger block from 001. The authoritative definition remains in 003.

### 2. `insertAttempt` — Atomicity via RPC (HIGH)
**Files:** `supabase/migrations/004_insert_attempt_rpc.sql`, `api/_lib/services/attemptService.ts`
The original two-round-trip approach (INSERT attempt → INSERT questions) had no transaction
wrapper. A failure on the questions insert left an orphaned `exam_attempts` row.
**Fix:** Replaced with a single `insert_attempt` RPC using a data-modifying CTE — both inserts
are a single SQL statement, atomic by definition.

### 3. `getAttempt` — 2 Round-Trips → 1 (MEDIUM)
**File:** `api/_lib/services/attemptService.ts`
The original code fetched `exam_attempts` and `exam_attempt_questions` in two separate queries.
**Fix:** Collapsed into a single PostgREST embedded select with `.order` on the referenced table.

### 4. `withAuth` — Dev Bypass Mode
**File:** `api/_lib/middleware/withAuth.ts`
Added `BYPASS_AUTH` / `BYPASS_AUTH_USER_ID` env var support for local testing without real auth cookies.

### 5. `saveAttempt` — 3 Round-Trips → 1 RPC (MEDIUM)
**Files:**
- `supabase/migrations/005_save_attempt_rpc.sql` — new migration
- `api/_lib/services/attemptService.ts` — saveAttempt rewritten to single RPC call
- `api/_lib/types.ts` — `SaveAttemptAnswer` trimmed (dropped `question_id`, `choices_order`)
- `src/types.ts` — same trim on the frontend mirror type
- `api/_lib/validators/attemptValidators.ts` — removed `question_id`/`choices_order` validation
- `api/_lib/database.types.ts` — manually patched `p_score`/`p_status` to `| null`
  (Supabase gen types doesn't emit nullable for optional SQL params — re-apply after every `supabase gen types` run)

**What the RPC does:**
1. `UPDATE exam_attempts` guarded by `AND exam_state = 'in-progress'` (TOCTOU guard).
   `score`, `status`, `email_report_state` written only when `p_exam_state = 'completed'` via CASE.
2. If UPDATE matched nothing: diagnoses not_found / forbidden / conflict via a second SELECT.
3. Bulk `UPDATE exam_attempt_questions … FROM jsonb_array_elements(p_answers)` — updates only
   `selected_choices` and `is_bookmarked`. If row count ≠ answers length → `RAISE EXCEPTION`
   (rolls back the whole function including step 1).
4. Returns `'ok' | 'not_found' | 'forbidden' | 'conflict'` as TEXT.

**Save cases handled:**
- In-progress save with dirty answers (normal mid-exam save)
- Submit with dirty answers — flush + complete atomically
- Submit with no dirty answers — metadata-only update, skips bulk UPDATE

### 6. `withAuth` — Local JWT Verification via `getClaims` (MEDIUM)
**File:** `api/_lib/middleware/withAuth.ts`
Replaced `getUser(accessToken)` (GoTrue HTTP round-trip on every request) with
`getClaims(accessToken)`. The project uses asymmetric (ECC/RSA) JWT signing keys, so
`getClaims` verifies the signature locally using `SubtleCrypto` + a cached JWKS
(module-level `GLOBAL_JWKS` in auth-js). Cold start: one `/.well-known/jwks.json` fetch.
Every subsequent request in the same warm Vercel container: zero network calls.
No new dependency, no new env var. The refresh path is unchanged.

### 7. Frontend Manual Save Flow
**Files:**
- `src/types.ts` — `Session.dirtyQuestions: Record<number, true>` added; `MARK_DIRTY`/`CLEAR_DIRTY` action types; `SessionData` exposes `dirtyQuestions`; `SessionControlContextType` exposes `syncProgress`
- `src/constants.ts` — new action types, `DEFAULT_SESSION.dirtyQuestions: {}`
- `src/utils/session.ts` — reducer special-cases `MARK_DIRTY` (merge single index) and `CLEAR_DIRTY` (wipe set) before the generic prop-lookup in both single and multi-action paths
- `src/hooks/useSessionReducer.ts` — `syncProgress()` and `isSyncing` state live here; `sessionUpdate` (component-facing dispatch) is gated on `isSyncingRef.current` to silently drop all actions during a sync flight; internal dispatches (`RESET_SESSION`, `CLEAR_DIRTY`) bypass the gate via raw `updateSession`
- `src/providers/SessionProvider.tsx` — passes `syncProgress` into `SessionControlContext`
- `src/contexts.ts` — default values updated for `dirtyQuestions` and `syncProgress`
- `src/components/Content/MultipleChoice.tsx` — batches `MARK_DIRTY` with `SET_ANSWERS`
- `src/components/Content/Bookmark.tsx` — batches `MARK_DIRTY` with `SET_BOOKMARKS`
- `src/components/Content/TopDisplay.tsx` — Save button (filled, sharp edges) in the question row left of bookmark; hidden in review mode and revision sessions; disabled when nothing is dirty
- `src/components/SyncOverlay.tsx` — full-screen dark overlay with spinner and "Saving..." text; always mounted while session is active; fades in on sync start, snaps away on end (`transition: opacity ease-in` only when `$visible=true`)
- `src/utils/attemptAdapter.ts` — both returned `Session` objects now include `dirtyQuestions: {}`

**Key design decisions:**
- Only dirty questions travel over the wire on each save (minimal payload).
- `sessionUpdate` gate is the single lock point — no per-component disabled logic needed.
- `syncProgress` guards against revision sessions (`examType === 'revision'`) and concurrent calls (`isSyncingRef`).
- `CLEAR_DIRTY` fires only on success, never in `finally`, so a failed save keeps the dirty set intact for retry.

---

## Remaining Backend Issues

~~Priority 1 — `withAuth`: GoTrue Network Call on Every Request~~ ✅

---

## Remaining Frontend Issues

~~Priority 1 — Exam submission mechanism~~ ✅
~~Priority 2 — Top display save button mobile responsiveness~~ ✅


## Migration Sequence State

| Migration | File | Status |
|---|---|---|
| 001 | `001_user.sql` | Fixed (duplicate trigger removed) |
| 002 | `002_count_user_sessions_rpc.sql` | Unchanged |
| 003 | `003_attempts.sql` | Unchanged (trigger race still present — Priority 1 above) |
| 004 | `004_insert_attempt_rpc.sql` | Applied ✅ |
| 005 | `005_save_attempt_rpc.sql` | Applied ✅ |
