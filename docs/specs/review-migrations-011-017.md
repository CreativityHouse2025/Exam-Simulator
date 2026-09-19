REVIEW: migrations 011-017 against spec-add-tracks.md / spec-add-tracks-api.md

Reviewed 2026-09-18. Only the findings that are NOT fixed in the migrations
themselves are recorded here — each needs a human decision or a change outside
supabase/migrations/. Everything else found in the review was fixed in place
(016 step 0 orphan check, 017 start_attempt sentinel, 017 choice-position
validation, duplicate question_id rejection in shared/schemas/attempt.schema.ts).

Not applicable: table-level RLS/grants. The Data API is revoked for every role
except service_role in production, so PostgREST exposure of questions/choices
is not a risk here.


===============================================================================
1. TWO SEEDED QUESTIONS HAVE NO CORRECT CHOICE — UNWINNABLE
===============================================================================

  STATUS: NOT REPRODUCIBLE. Closed 2026-09-18 without changing the banks.

    Verified at every layer: both questions carry exactly one correct choice.
      src ar/10.json 1740  [false, true, false, false]
      src en/10.json 1740  [false, true, false, false]
      src ar/15.json 2653  [false, true, false, false]
      src en/15.json 2653  [false, true, false, false]
      database       1740  4 choices, 1 correct
      database       2653  4 choices, 1 correct
    Questions with no correct choice, across all 42 banks in both languages: 0.
    Same count in the database: 0. Editing these flags would CREATE the bug this
    finding describes.

    Action (b) was still worth taking: generate-question-seed.py now asserts that
    every emitted question has at least one correct choice and refuses to write
    the migration otherwise. Nothing violates it today.

  ---------------------------------------------------------------------------
  Original finding, kept for the record:

  Where
    supabase/migrations/015_question_banks.sql, choices section:
      question 1740  — exam 10 (PMI Exam 1), question_index 85
      question 2653  — exam 15 (PMI Exam 3), question_index 86
    Source rows: src/data/exam/{ar,en}/10.json id 1740, {ar,en}/15.json id 2653.

  Issue
    Every choice row for these two questions carries is_correct = false in both
    languages. scripts/generate-question-seed.py checks ar/en parity, id
    collisions and intra-exam duplicates (12.0) but never "at least one correct
    choice per question", so the rows were emitted as-is.

  Consequence
    submit_attempt (017) grades a question by comparing
      array_agg(position) FILTER is_correct   -- NULL for these two
    against the student's selected positions. NULL = anything is NULL, so the
    question is counted wrong no matter what is selected. Silent: no error, the
    student loses one point on exams 10 and 15 with no way to earn it.

    The revision endpoint (10.4) also always includes them in the retry set,
    and the "correct answer" shown after completion is empty.

  Action (human)
    a. Fix the `correct` flag in BOTH src/data/exam/ar/<n>.json and
       src/data/exam/en/<n>.json for each id, or add the id to
       EXCLUDED_QUESTION_IDS in scripts/generate-question-seed.py if the
       answer cannot be determined.
    b. Add an assertion to generate-question-seed.py: every emitted question
       has >= 1 choice with correct = true; fail loudly otherwise (same style
       as the count assertions).
    c. Regenerate 015. Expected counts in the header change only if (a) chose
       exclusion.


===============================================================================
2. 016 STEP 6 BACKFILL KEEPS EXCLUDED QUESTION IDS IN question_ids_snapshot
===============================================================================

  STATUS: CONFIRMED, ACCEPTED AS-IS. Decided 2026-09-18 (option "leave it").

    The drift is real and the analysis below stands. No filter is applied to the
    backfill. Recorded in 016 step 6 so it reads as a known state rather than a
    bug waiting to be rediscovered.

    Scope: PRE-EXISTING attempts on exams 1, 3 and 5 only, on a database that
    already holds attempt_answers rows — i.e. production, not a local reset.
    New attempts are unaffected.

  ---------------------------------------------------------------------------
  Original finding:

  Where
    supabase/migrations/016_attempts_cleanup.sql, step 6, first UPDATE:
      array_agg(question_id ORDER BY question_index) over attempt_answers.

  Issue
    Pre-migration attempts carry one attempt_answers row per question,
    including the 8 ar/en conflicts excluded from 015 (640, 643, 989, 990,
    992, 993, 994, 1381 — see the block at the top of spec-add-tracks-api.md).
    The backfill copies those ids into question_ids_snapshot. Step 7 then
    deletes their attempt_answers rows (they fail the new FK), but an integer[]
    is not FK-checked, so the ids stay in the snapshot.

  Consequence
    For any historical attempt on exams 1, 3 or 5:
      - total_questions = cardinality(question_ids_snapshot) advertises 175
        while GET /api/attempts/:id can fetch content for only 173/170/174.
      - Content is "ordered by question_ids_snapshot" (10.3); the frontend
        indexes questions by snapshot position, so every question after a
        missing id is off by one.
      - GET /api/attempts/:id/revision (10.4) computes snapshot MINUS correct;
        the excluded ids have no answer row and fall into the retry set with no
        content to render.
    New attempts are unaffected — start_attempt reads exam_questions, which
    never contained these ids.

  Options (human)
    a. Strip unknown ids during the backfill. Change the first UPDATE's
       aggregate to
         array_agg(question_id ORDER BY question_index)
           FILTER (WHERE EXISTS (SELECT 1 FROM public.questions q
                                  WHERE q.id = attempt_answers.question_id))
       The stored score stays as computed against the old bank, so a
       historical attempt's score no longer equals correct/cardinality. Accept
       and document, or
    b. Recompute score for affected attempts from their remaining rows
       (changes numbers students already saw), or
    c. Resolve the 8 conflicts first (spec top block), regenerate 015, and
       the problem disappears because the ids exist.
    (c) is the only option with no data loss; (a) is the smallest change if the
    conflicts stay open.


===============================================================================
3. save_attempt TRUSTS p_offered_breaks (highlight, not fixed)
===============================================================================

  STATUS: PARTIALLY CLOSED 2026-09-18 — clock fixed, index validation declined.

    Fixed: offered_at is now stamped with now() inside save_attempt. The client
    no longer sends it, and p_offered_breaks is a plain array of break indices
    ([60, 120]) rather than objects.

    Declined: show_at_index is still not checked against config_snapshot->'breaks'.
    Ownership and state are enforced, the primary key bounds it to one row per
    index, and the worst case is a student corrupting their own break record.

  ---------------------------------------------------------------------------
  Original finding:

  Where
    supabase/migrations/017_attempt_rpcs.sql, save_attempt, the INSERT into
    public.offered_breaks.

  Issue
    Neither field is validated:
      - show_at_index is not checked against config_snapshot->'breaks'. A client
        can record an offer for an index the exam has no break at.
      - offered_at is the client's clock, written verbatim.
    Ownership and state are enforced, so only the attempt's own owner can write
    these rows, and the PK plus ON CONFLICT DO NOTHING bound them to one row per
    index. Impact is limited to a student corrupting their own break record.

  If it is to be closed
    - membership: count entries whose show_at_index is not in
        SELECT (b->>'show_at_index')::smallint
          FROM jsonb_array_elements(config_snapshot->'breaks') b
      and return 'invalid_question'-style sentinel (or a new 'invalid_break').
    - clock: write now() instead of (e->>'offered_at')::TIMESTAMPTZ and drop the
      field from the request schema. The frontend only needs "was it offered".
