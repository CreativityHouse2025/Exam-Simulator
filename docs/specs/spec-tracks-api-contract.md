API CONTRACT — tracks, exams, attempts

Concise reference. Decisions + endpoints + schemas only. No RPCs, no migrations, no
service/middleware internals — see spec-add-tracks-api.md for that.

Envelope on every response: { success: true, data: T } or
{ success: false, error: { code } }. List responses are always a named key
({ tracks: [...] }), never a bare array.

A failure carries the CODE ONLY. There is no message on the wire: a server-side
description names ids and often the driver's own error, which would leak schema
and constraint names to anyone reading a network tab. It is logged instead. The
frontend resolves translated copy from the code and never used the message.


===============================================================================
DECISIONS
===============================================================================

- Frontend renders only. Backend owns config, question selection/order, grading,
  and access control.
- Question banks live in the database, not the app bundle.
- Track access requires an ACTIVE enrollment — the window CONTAINS now, both
  bounds — for BOTH roles. An adjacent renewal is legal, so `expires_at > now()`
  alone would also match a not-yet-started one.
  Expired reads the same as never-enrolled — a flat 403, no distinction.
  REVERSED 2026-09-19: supervisors no longer bypass enrollment. A supervisor
  enrolls in a track exactly as a student does, and sees nothing of a track they
  hold no active enrollment in — not its exam list, not its question content, and
  not a student's attempts within it.
- An attempt stays reachable after its enrollment expires. Attempts are gated by
  ownership, never by enrollment.
- Content is single-language (?lang=ar|en), never bilingual in one response.
- Answer disclosure (is_correct / explanation) is included when the caller is a
  supervisor, OR the exam allows revealing answers, OR the attempt is completed.
  Otherwise the fields are omitted — not null, absent.
- A student never gets direct access to question content. Only through an attempt
  they own, or that attempt's revision set.
- A track's exam list includes each exam's full config. There is no separate
  single-exam endpoint.
- The supervisor's exam-content endpoint also returns that exam's full details —
  the same ExamDetails one entry of the track's list carries, config included.
  A preview session reads content without ever reading that list, so the name and
  question count have to travel with the content or they are unreachable.
- Grading is server-side and happens only on submit. Saving progress never grades
  and never accepts a score or pass/fail from the client.
- An attempt's question set and order are frozen at creation. Editing an exam's
  questions later never changes an attempt already taken.
- A student may hold more than one unfinished attempt for the same exam at once.
  Every start creates one, and nothing is ever deleted on start. Sending the
  request once is the frontend's job — there is no server-side de-duplication of
  a double click.
- An account holds at most 25 attempts per track and 50 attempts total; the oldest
  is dropped once a cap is exceeded.
- A completed attempt with retry enabled can regenerate a "wrong or unanswered"
  set at any time. An empty result is valid, not an error.
- Submitting an attempt returns a result summary only: score, pass/fail, and how
  many of the attempt's questions were wrong. Submission lands on the summary
  page, which needs nothing else. A student who then wants a question-by-question
  review reads the completed attempt, which discloses the answer key by then —
  so the heaviest payload in the app is fetched only by the students who ask for
  it, instead of on every submission.
- A revision response carries the parent exam's plain details (no config)
  alongside its questions; a question's id is read off the question itself, not
  listed separately.
- A supervisor can read a student's tracks and attempt summaries, never that
  student's actual answers.
- Student search returns profiles only. A supervisor opening a hit fetches that
  one student's details, which is where the tracks come from — the list stays
  cheap however many rows match, and the detail call is the only place a
  student's enrollments are assembled. That call answers with the same
  { user, tracks } shape as /api/auth/me: a profile and the tracks it can open
  are never wanted apart, so one reader serves both and the frontend keeps one
  adapter.
- Starting an attempt returns the exam alongside it, without the exam's config.
  Starting navigates straight into the session, which needs the name before the
  track's exam list has necessarily loaded; the config is deliberately absent
  because the attempt's own config_snapshot governs the session, and a second,
  possibly newer config in the same payload is only a chance to read the wrong
  one.
- Every response uses snake_case field names, matching the database. Any
  camelCase mapping is the frontend's own job.
- 8 questions are excluded from the database entirely — Arabic and English
  disagree on the correct answer for them, and no student is ever served one.


===============================================================================
ENDPOINTS
===============================================================================

| Method | Path                          | Access                                     | Request                            | Response |
|--------|-------------------------------|---------------------------------------------|-------------------------------------|----------|
| GET    | /api/auth/me                  | any authenticated                            | –                                   | { user: User, tracks: EnrolledTrack[] } |
| GET    | /api/tracks                   | any authenticated                            | –                                   | { tracks: Track[] } |
| GET    | /api/tracks/:trackId/exams    | active enrollment (either role)              | –                                   | { exams: ExamDetails[], types: ExamType[] } |
| GET    | /api/exams/:examId/questions  | supervisor + active enrollment in its track   | ?lang=ar\|en                        | { exam: ExamDetails, questions: DisclosedQuestion[] } — always disclosed |
| POST   | /api/attempts                 | student (active enrollment)                  | { exam_id: number, lang: ar\|en }   | { attempt: AttemptDetail, questions: AttemptQuestion[] \| DisclosedAttemptQuestion[], exam: Exam } — 201 |
| GET    | /api/attempts                 | owner                                         | ?trackId=uuid (required)            | { attempts: AttemptSummary[] } |
| GET    | /api/attempts/:id             | owner                                         | ?lang=ar\|en                        | { attempt: AttemptDetail, questions: AttemptQuestion[] \| DisclosedAttemptQuestion[] } — per the disclosure rule (always disclosed once completed) |
| PATCH  | /api/attempts/:id             | owner                                         | SaveAttemptRequest                   | – (empty) |
| POST   | /api/attempts/:id/submit      | owner                                         | SubmitAttemptRequest                 | AttemptResult — the results summary; no question content |
| GET    | /api/attempts/:id/revision    | owner                                         | ?lang=ar\|en                        | { parent_exam: Exam, questions: DisclosedQuestion[] } — always disclosed; sent without its config |
| GET    | /api/students                 | supervisor                                    | ?q=string (min 2 chars)             | { students: StudentProfile[] } — search hits, no tracks |
| GET    | /api/students/:id             | supervisor                                    | –                                   | { user: User, tracks: EnrolledTrack[] } — the same shape /api/auth/me returns |
| GET    | /api/students/:id/attempts    | supervisor + active enrollment in that track  | ?trackId=uuid (required)            | { attempts: AttemptSummary[] } |


===============================================================================
SCHEMAS
===============================================================================

  BilingualText     { ar: string, en: string }

  User              { id: uuid, email: string, first_name: string, last_name: string,
                      created_at: string, role: student|supervisor }
                      — no expiry. An account signs in indefinitely; what it may
                        open is decided by its enrollments alone

  Track             { id: uuid, name: BilingualText, description: BilingualText|null }
  EnrolledTrack     Track & { expires_at: string }

  ExamType          { id: number, name: BilingualText, colour: string|null }

  Break             { show_at_index: number, duration_minutes: number }
  ExamConfig        { exam_duration_minutes: number|null, passing_rate: number,
                      can_reveal_answers: boolean, allow_retry_wrong: boolean,
                      breaks: Break[] }

  Exam              { id: number, track_id: uuid, type_id: number, display_order: number,
                      name: BilingualText, description: BilingualText,
                      question_count: number }
  ExamDetails       Exam & { config: ExamConfig }

  Choice            { position: number, text: string }
  DisclosedChoice   Choice & { is_correct: boolean }
  Question          { id: number, type: string, text: string, choices: Choice[] }
  DisclosedQuestion Question & { explanation: string, choices: DisclosedChoice[] }
                      — disclosure is a TYPE distinction, not optional fields: a
                        response carries one shape or the other, never a mix
  AttemptQuestion            Question & { selected_choices: number[], is_bookmarked: boolean }
  DisclosedAttemptQuestion   DisclosedQuestion & { selected_choices, is_bookmarked }

  AttemptSummary    { id: uuid, exam_id: number, exam_state: in-progress|completed,
                      score: number, status: pass|fail|null, created_at: string,
                      time_remaining: number, config_snapshot: ExamConfig,
                      total_questions: number }
  AttemptDetail     AttemptSummary & { current_index: number,
                      offered_breaks: number[] }
                      — offered_breaks holds the show_at_index values already
                        offered, so a resumed attempt does not re-offer them

  AttemptResult     { score: number, status: pass|fail, wrong_questions: number,
                      total_questions: number }
                      — wrong_questions counts answered-wrong AND unanswered

  SaveAttemptAnswer     { question_id: number, selected_choices: number[],
                          is_bookmarked: boolean }
  SaveAttemptRequest    { current_index: number, time_remaining: number,
                          answers: SaveAttemptAnswer[], offered_breaks?: number[] }
  SubmitAttemptRequest  { current_index: number, time_remaining: number,
                          answers: SaveAttemptAnswer[] }

  StudentProfile    { id: uuid, first_name: string, last_name: string, email: string,
                      created_at: string }
                      — search hits only; a student opened in full is a User
