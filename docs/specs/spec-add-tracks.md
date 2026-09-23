FEATURE: Add tracks rather than harcoding PMP only, refactor the database to be more flexible and correct some bad decisions taken earlier. 

OVERVIEW:
Current database design (009 migration and below) has smells, these smells must be fixed before a new update to the database is introduced.
Key decision in this update: no hardcoding at all, everything configurable, frontend dumb, backend and storage take the heavy load. 

DECISIONS:
1. Revision attempts not stored in the database, hence no need to store parent_attempt_id at all
2. The two exam categories: domain, full aren't real, domain exams are just normal exams with different configuration, drop category_id and restructure files to be stored together, everything becomes under just "exams", each with an ID, exams just happen to have types for UI purposes, behavior is stored in config
3. exam_attempts: review_state no longer needed, routing decion is simple now, if exam is completed -> results, otherwise -> current_index
4. email_report_state no longer needed, email reports not needed anymore. moreover, existing checks, triggers, functions etc. that include any of the remove columns are removed if no longer valid, or highlighted to dev if still used by app.
5. break(*)_offered_at (1,2) broke by new database design introduced in migration 011, breaks must be stored in different table
6. exam_attempt_questions renamed to attempt_answers, choices_order dropped, choices no longer shuffled. 
7. Exam UI now fully depends on configuration of that exam (configurations stored on the database, a configuration for revisions is stored as a constant in frontend that defines its behavior, frontend adds a persist flag to fetched configs that is always true, except for revisions), it is config-based, no `if 'full' else if 'domain' else` anywhere now.
8. Student dashboard now starts by displaying all tracks that student is enrolled to and active in. Selecting a track displays all exams that track offers and students can filter by the database-fetched exam types (not harcoded in UI)
9. Exam content files now stored on Supabase S3 paths gated by a secret, only students who enrolled and active can access that track's exams.
10. A migration is written to update all domain attempts exam_id and set it to the new assigned exam id of that domain
11. A migration is written to add rows to the breaks table for break*_affered_at for existing attempts
12. Choice shuffling/(reordering from backend) logic is removed from frontend completely.

AGENT TASK:
No implementation, discovery and planning only, then writing a full spec for the mentioned decisions. No code touches, migrations only. Migrations never applied remotely without developer consent.

Do not implement until you are sure you know what you will do. If you don't know anything, ask, don't assume.


===============================================================================
FRONTEND REFACTOR — RESOLVED DECISIONS
===============================================================================

Resolved in session of 2026-09-17. Everything below is agreed, not proposed.
Deleting src/data/exam/full-exams.json and categories.json broke 20 typecheck
errors across 7 files; this section is what replaces them.


SCOPE — TWO PASSES

Pass 1 (this work):
  - shared/schemas/exam.schema.ts, track.schema.ts
  - src/services/exams.service.ts, src/services/track.service.ts (stub data,
    in-memory, async signatures identical to the future API clients)
  - src/utils/queryOptions.ts additions
  - ExamProvider (props-driven, session-independent)
  - SessionProvider + session reducer + contexts refactor
  - collapse the three exam trees into one config-driven tree
  - per-track routing: routes.ts, nav.ts, track list, track exam list,
    track history, supervisor track picker
  - exam label rework (delete the two hooks and resolveExamLabel)
  - 013 migration edit (config_snapshot), 011 migration edit (exam_type
    colour) and the matching seed_tracks.sql values
  - attempts run through noopAttemptPersistence — nothing is written to the DB
Pass 2 (next):
  - insert_attempt / save_attempt RPC rewrite, offered_breaks write path
  - attemptService + validators stop reading dropped columns; AttemptSummary
    gains config_snapshot (see 27.b) and the list query filters by track in
    SQL with the limit applied after (see 22.b)
  - real /api/exams and /api/tracks endpoints replacing the stub bodies

Consequence of pass 1: no attempt is persisted, so resume cannot be manually
tested until pass 2 lands. `npm run verify` is the pass 1 success criterion.


13. TYPES

  a. `type Exam = Question[]` is deleted. An exam is an entity, not a list of
     questions. `Question[]` is self-describing and needs no alias.
  b. Every type shared between frontend and backend lives in shared/schemas as
     a Zod schema. New: exam.schema.ts (Exam, ExamDetails, ExamConfig,
     ExamType), track.schema.ts (Track). Written now, reused by the API in
     pass 2.
  c. Two exam types, not one with optional fields:
       Exam        — the exams row: id, trackId, typeId, displayOrder, name,
                     description, questionCount
       ExamDetails — Exam & { config: ExamConfig }, returned only by getExam
     Named ExamDetails (not ExamWithConfig) so no reader mistakes it for
     questions.
  d. ExamConfig: durationMinutes (null = untimed), passingRate,
     canRevealAnswers, allowRetryWrong, breaks[{ showAtIndex, durationMinutes }],
     persist.
  e. ExamType union "full" | "domain" | "revision" in src/types.ts is deleted.
     Exam types are data (exam_type rows), never a union in code.
  f. Session becomes a single interface. The FullExamSession / DomainExamSession
     / RevisionSession union is deleted.


14. SERVICES

  a. src/services/exams.service.ts
       getTrackExams(trackId): Promise<{ exams: Exam[]; types: ExamType[] }>
       getExam(examId): Promise<ExamDetails>
  b. src/services/track.service.ts
       getTracks(): Promise<Track[]>
  c. trackId is required. There is no "all exams" call — exams are always per
     track.
  d. The list call never carries config. Duration and passing rate move off the
     exam-library cards to the exam detail page, which already fetches
     getExam.
  e. Services own the DB-row -> frontend-object adaptation (camelCase, nested
     config). Consumers never see snake_case.
  f. All methods are async even while backed by in-memory data, so swapping in
     the real fetch changes only the function body.
  g. Stub data sources from src/data/exam/exams.json and exam-types.json where
     they already carry the values; tracks, exam_config and breaks literals
     mirror supabase/seed_tracks.sql.
  h. src/utils/queryOptions.ts gains createTracksQueryOptions(),
     createTrackExamsQueryOptions(trackId), createExamQueryOptions(examId),
     createStudentTracksQueryOptions(userId).


15. EXAM PROVIDER — SESSION-INDEPENDENT

  a. <ExamProvider examId questionIds?> takes props and never reads session.
     It resolves ExamDetails through useQuery(createExamQueryOptions(examId))
     and loads the question bank.
  b. ExamContext = { examDetails: ExamDetails | null; questions: Question[] | null }.
     Both read-only. Config is nested inside examDetails, never on Session.
  c. src/pages/exam-detail/index.tsx drops its duplicated loader and renders
     ExamProvider with the route param.
  d. The `?id=` search-param guard and useUnsavedChangesWarning move out of the
     provider into the session tree, where they belong.
  e. ExamPage keeps the loading gate: render Loading while questions are null,
     so the session tree below retains its non-null guarantee.


16. SESSION PROVIDER

  a. No method accepts an exam type. startNewExam(examId, { preview }) is the
     only start path; preview is frontend-only and never part of config.
  b. startNewExam resolves config via queryClient.fetchQuery(
     createExamQueryOptions(examId)) — same cache key ExamProvider reads, so
     the provider's later read is a cache hit, not a second request.
  c. resumeAttempt(attemptId) reads config from the attempt's config_snapshot.
     It never fetches the exam's current config (see 17).
  d. startRevision(attemptId) uses the frontend REVISION_CONFIG constant with
     persist: false. No fetch.
  e. Session fields removed: examType, categoryId, reviewState,
     questionChoiceOrders, break1OfferedAt, break2OfferedAt.
  f. selectedOriginalIndices renamed to selectedChoices. The old name described
     the shuffle that no longer exists; the new one matches the
     attempt_answers.selected_choices column.
  g. questionIds is always number[]. The 'ALL' sentinel is removed — the full
     id list is written for every session.
  h. offeredBreaks: Record<showAtIndex, isoTimestamp> replaces the two fixed
     break fields, matching public.offered_breaks.
  i. Choice ordering is gone: applyQuestionChoiceOrders is deleted, no
     choices_orders is built or sent, question choices always render in source
     order.


17. CONFIG SNAPSHOT (migration 013, edited in place)

  a. exam_attempts gains config_snapshot jsonb NOT NULL holding the whole
     config at start time:
       { exam_duration_minutes, passing_rate, can_reveal_answers,
         allow_retry_wrong, breaks: [{ show_at_index, duration_minutes }] }
  b. Rationale: an attempt is self-contained. Config is read once, at start.
     Resuming reads the snapshot, so editing an exam's config never changes an
     in-flight or historical attempt.
  c. The whole config is snapshotted, not only timing and scoring —
     can_reveal_answers and allow_retry_wrong are behavioural and would
     otherwise drift for resumed and historical attempts.
  d. Backfill for existing rows joins exams -> exam_config -> breaks, then the
     column is set NOT NULL.
  e. Landed inside 013 rather than a new migration: 013 is unapplied in
     production and already owns the attempts cleanup.


18. EXAM TREE — ONE CONFIG-DRIVEN TREE

  a. src/components/exam/{full,domain,revision}/ collapse into
     src/components/exam/. The three trees were ~90% identical.
  b. useFullExamSession / useDomainExamSession / useRevisionExamSession
     collapse into useExamSession.
  c. ExamPage renders the provider unconditionally — the
     switch (session.examType) is deleted.
  d. Feature rendering is driven by config only:
       config.breaks.length > 0      -> break modals
       config.durationMinutes !== null -> timer and pause
       config.canRevealAnswers       -> mid-session reveal button
       config.allowRetryWrong        -> retry-wrong button on the summary
       config.persist === false      -> no sync, no DB write (revision)


19. REVIEW STATE

  a. reviewState leaves Session, the reducer, SessionExamContext, the
     attemptAdapter and the DB (013 drops the column).
  b. The summary/question toggle it also drove survives as local component
     state in the exam tree, seeded from examState (completed -> summary,
     in-progress -> question). Reviewing a finished attempt per question still
     works; nothing about it is persisted.


20. EXAM LABELS

  Two different problems shared one name. Both are solved in pass 1.

  a. Inside a live session — no lookup needed. The collapsed ExamTopDisplay
     and useResults read examDetails.name from ExamContext.
     src/hooks/useFullExamLabel.ts and src/hooks/useCategoryLabel.ts are
     deleted with no replacement.
  b. useResults loses sourceType ("category" | "exam"); the distinction does
     not exist any more.
  c. Attempt lists — resolved from the page's track. AttemptHistoryRow,
     student-attempts/AttemptCard and AttemptDetailDialog take the exams
     lookup already fetched by their page via getTrackExams(trackId) and read
     the name from it, falling back to String(examId).
     src/utils/resolveExamLabel.ts is deleted.
  d. Until pass 2 rewrites the attempts API, an attempt's exam id is read as
     `attempt.exam_id ?? attempt.category_id + 17` (migration 012's remap) in
     one adapter function, not inline at each call site.


21. PER-TRACK ROUTING

  The active track lives in the URL. Every page is linkable and reproducible
  per track, and the route guard checks enrollment against the param.

  a. Student routes:
       /                          redirect by role (student -> /tracks)
       /tracks                    track list
       /tracks/:trackId           exam list for the track + continue-latest
       /tracks/:trackId/history   that track's attempts
  b. Supervisor routes:
       /students                  search (unchanged)
       /students/:id              tracks that student is enrolled in
       /students/:id/tracks/:trackId/attempts
  c. Exam routes drop the :type segment — type is data, not a URL literal:
       /exams/:id and /exams/:id/preview. ROUTES.examDetail.to and
       examPreview.to lose their `type` argument, and their import of
       ExamListItem (a type that no longer exists) goes with it.
  d. nav.ts: the static history item leaves the student nav — history is
     reached inside a track. The nav gains a tracks entry.
  e. Continue-latest moves off the old StudentDashboardPage onto
     /tracks/:trackId. StudentDashboardPage is replaced by the track list.
  f. src/services/student.service.ts gains getStudentTracks(userId),
     supervisor-only, stubbed in pass 1. It lives there, not in track.service,
     because it is a read about another user — the same shape as
     searchStudents and getStudentAttempts, under the same role guard, and it
     will be served by /api/students/:id/tracks rather than /api/tracks.
     track.service keeps only getTracks(), meaning the viewer's own
     enrollments.
  g. Expired enrollments are listed in /tracks in a disabled state.
     /tracks/:trackId/history stays readable so past attempts never become
     unreachable; the exam list renders read-only and the guard refuses to
     start an attempt.


22. KNOWN LIMITATIONS UNTIL PASS 2

  a. attemptService.ts:124 and :163 still select exam_type, category_id,
     review_state, email_report_state, break_*_offered_at, choices_order and
     exam_attempt_questions — all dropped or renamed by 013. These endpoints
     500 against a migrated database, so attempt pages cannot be exercised in
     pass 1 no matter what the frontend does.
  b. exam_attempts carries no track_id and has no FK to exams, so the track
     filter is client-side in pass 1. attemptService.ts:130 applies
     .limit(50) server-side, before that filter, so a track's older attempts
     can be missing from its history page. Pass 2 fixes this by joining exams
     and filtering in SQL, with the limit applied after.
  c. Attempt statistics (total, average score, pass rate) become per-track,
     because the page that computes them is now per-track.


23. WHY — CONTEXT FROM THE PLANNING SESSION

  None of this is derivable from the repository. It is recorded so the
  implementing agent does not re-litigate settled decisions or "simplify" them
  back into the shapes they were deliberately moved away from.

  a. ExamProvider is props-driven on purpose. Folding ExamContext into
     SessionProvider as a 6th context was proposed and rejected after listing
     its risks: exam data would live on every authenticated route; the loading
     gate could not block, and useExamSessionCore's `exam as Exam` assertion
     depends on that gate holding; rendering the context conditionally would
     remount the whole authenticated subtree and lose sibling page state;
     SessionProvider would gain a second responsibility; and no session-free
     page could ever reuse the loader, leaving exam-detail duplicating it
     forever. Props won because exam-detail reuses it.
  b. Config lives on ExamContext because ExamContext is read-only and config is
     read-only. Session is writeable state. Do not move config onto Session.
  c. SessionProvider and ExamProvider both resolve config through the same
     createExamQueryOptions(examId). SessionProvider calls it imperatively
     (queryClient.fetchQuery, inside startNewExam), ExamProvider through
     useQuery. Same cache key, so the second read is a cache hit. This is not
     an accidental double fetch — do not "fix" it by threading config as a
     prop.
  d. resumeAttempt deliberately never refetches the exam's current config. The
     snapshot is the point: editing an exam's config must not change an
     in-flight or already-finished attempt.
  e. The list call carries no config deliberately. Duration and passing rate
     were removed from the exam-library cards for this. Do not restore them by
     fattening the list payload.
  f. ExamDetails is named that way, and not ExamWithConfig, because
     `type Exam = Question[]` used to exist. The name has to stop a reader
     assuming an exam is a list of questions.
  g. Services returning raw DB-row shape was chosen first and then reversed.
     Services own the mapping; consumers never see snake_case.
  h. getTrackExams requires a trackId and there is no all-exams call, because
     exams are always per track. getExamsByIds and per-row getExam were both
     proposed for label resolution and rejected for this reason.
  i. reviewState had two jobs. Removing it outright would have stranded a
     finished attempt on whichever screen it opened with — see 19.
  j. The snapshot carries the whole config, not just timing and scoring,
     because can_reveal_answers and allow_retry_wrong are behavioural and
     would otherwise drift for resumed and historical attempts.
  k. config_snapshot went into 013 rather than a new 014 on the assumption
     that 013 has only ever been replayed on the local stack. Confirm that
     before replaying anywhere else; if it has run elsewhere, it needs its own
     migration instead.
  l. The two-pass split exists to keep the diff reviewable, not because the
     attempts API is healthy. It is already broken by 013 independently of
     anything in pass 1.
  m. Per-track routing was pulled into pass 1 because label resolution needs a
     track in scope; it is not scope creep.


24. STARTING STATE AND SUCCESS CRITERIA

  a. Baseline: `npm run verify` fails with 20 typecheck errors across 7 files,
     all caused by the deleted src/data/exam/full-exams.json and
     categories.json:
       src/components/exam-dropdown/CategoryDropdown.tsx
       src/components/exam-dropdown/FullExamDropdown.tsx
       src/hooks/useCategoryLabel.ts
       src/hooks/useFullExamLabel.ts
       src/pages/exam-detail/index.tsx
       src/pages/exam-library/index.tsx
       src/utils/resolveExamLabel.ts
     src/config/routes.ts additionally imports ExamListItem, a type this spec
     deletes.
  b. src/data/exam/exams.json and exam-types.json still exist and already
     carry id, type, name.{ar,en} and questionCount for all 43 exams. They are
     the stub data source. Only tracks, exam_config and breaks need fresh
     literals, mirroring supabase/seed_tracks.sql.
  c. Success criterion for pass 1 is `npm run verify` green, plus a session
     that starts and runs against the stubs.
  d. Not testable in pass 1, by design: resume, submit, break persistence and
     every attempt list. Their endpoints 500 against a migrated database until
     pass 2.


25. EXAM LIST COMPONENTS

  a. The supervisor exam library becomes track-scoped. It takes trackId and
     title as props and fetches its own exams and types with
     getTrackExams(trackId). It no longer lists every exam in the system, which
     is why no all-exams call exists.
  b. The student's track exam list is a separate component, not a shared one
     with the library. The two differ in what a card does — the student starts
     an attempt, the supervisor opens the question viewer or a preview session
     — and each is free to diverge in layout. The duplicated fetch, filter
     chips, search and empty state are the accepted cost.
  c. Both are driven by the same getTrackExams response: the filter chips come
     from `types`, never from hardcoded tabs.
  d. src/components/exam-dropdown/FullExamDropdown.tsx and CategoryDropdown.tsx
     are deleted. They are per-exam-type by construction, and the student's
     track exam list replaces them as the way to start an exam.
     StudentDashboardPage goes with them (see 21.e).


26. EXAM TYPE COLOURS

  a. ExamCard's ACCENT map (ExamCard.tsx:17-26) and ExamTypeBadge are keyed by
     the literals "full" and "domain". Both keys cease to exist.
  b. public.exam_type gains a colour column, set by the seed, and the card
     reads it. Whoever adds an exam type picks its colour; the frontend
     hardcodes no type names and needs no edit when a type is added.
  c. The frontend must tolerate a missing or unrecognised value and fall back
     to a neutral style rather than failing to render.
  d. The column goes into 011 in place, under the same assumption as 013 (see
     23.k): those migrations have only ever been replayed on the local stack.
     Confirm before replaying elsewhere.
  e. supabase/seed_tracks.sql claims in its header to be generated by
     scripts/generate-track-seed.py, but no scripts/ directory exists in the
     repository and the seed file itself is untracked. Treat the seed as
     hand-edited: add the colour values directly, and do not go looking for a
     generator to re-run.


27. REMAINING TYPE-BRANCHING AND FILE MOVES

  Found by auditing the code against this spec. All of it is required for
  `npm run verify` to pass; none of it is optional cleanup.

  a. src/utils/exam.ts still imports ../data/exam/full/<lang>/<id>.json and
     ../data/exam/domain/<lang>/<id>.json. Those directories no longer exist —
     the banks now live at src/data/exam/<lang>/<id>.json with the merged id
     space (domain ids shifted by +17, see migration 012). loadFullExam and
     loadDomainExam collapse into one loadExam(examId, langCode).
  b. canRetryAttempt(examType, hasWrongAnswers) at src/utils/exam.ts:35 is
     `examType === 'full' && hasWrongAnswers` — exactly the branching this
     refactor removes. It is deleted, not rewritten. Its callers read
     allowRetryWrong instead:
       - FullExamSummary.tsx:36 — from the session's config, in scope.
       - AttemptHistoryRow.tsx:32 — from the attempt's own config_snapshot.
         The attempt already carries its whole config; the list endpoint
         returns it in pass 2, so AttemptSummary gains config_snapshot. Using
         the exam's current config here would be wrong for a historical
         attempt whose config has since changed.
  c. translate(`exam.type.${type}`) at ExamCard.tsx:31 and
     exam-detail/index.tsx:163 is dead — exam type names come from the
     database (name_ar / name_en). The exam.type.* keys are removed from
     src/data/langs/{ar,en}.json, and the track list, track exam list and
     track history pages add their own keys there.
  d. DEFAULT_FULL_SESSION, DEFAULT_DOMAIN_SESSION and DEFAULT_REVISION_SESSION
     (constants.ts:45, :66, :85) collapse into one DEFAULT_SESSION, since
     Session is now a single interface. useSessionReducer.ts:16 follows.
     SESSION_ACTION_TYPES and the SessionActionsMap in types.ts lose
     SET_REVIEW_STATE, SET_BREAK1_OFFERED_AT and SET_BREAK2_OFFERED_AT.
  e. ExamTypeBadge and PreviewExamButton both take a `type` prop that no
     longer exists. The badge takes the type's name and colour (see 26); the
     preview button takes only an exam id (see 21.c).
  f. src/utils/attemptAdapter.ts is rewritten: no reviewState, no
     questionChoiceOrders, no exam_type branching, maxTime from the snapshot's
     duration rather than from exam-types.json.


28. STILL OPEN — DECIDE BEFORE IMPLEMENTING

  a. What an attempt row renders when its exam id is not in the current
     track's list. String(examId) was assumed as a fallback and never
     examined.
