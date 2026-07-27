FEATURE: Supervisor view student attempts

User Story:

- As a supervisor, I would like to have the permission to search for a student by email or name (first or last) and see the results, and choose a student to see all of his attempts, and see a specific attempt's deatils.

OVERVIEW:
Allow users with a supervisor role to have the authority to access any student's attempts in the system, while disallowing any other users to do so.

OVERALL ACCEPTANCE CRITERIA: 

1. The search page should have a search bar that accepts a user email or name
2. The search has 5 UI states: idle (prompt to start typing), loading (skeleton), populated (data view, rendered as cards rather than a literal HTML table — reuses the existing `Card` primitive instead of introducing a new `table` component), empty (UI feedback of no results found), error
3. The screens design should follow Figma Make's design at "www.figma.com/make/5Trs1m1PSXMVG3DUye7B49" without strictly following any code or debugging components (only styling and design)
4. The search bar's requests must be handled using an abort controller to ensure latest result ONLY make it through the interface
5. The API for searching for students and getting a student's attempts should be only allowed for supervisors
6. We need to show a breadcrumb on top, and preserve the state of the search and result when supervisors clicks a specific user and goes back to the page (only save it when there is a transition from students to a student attempts)
7. Attempts returned must be ordered by date (first is latest)
8. The pages must have opening animation similar to the exams page
9. Two new API Handlers (authorized by supervisors only): (root is `/api/students`)
10. Handler 1: `/api/students?q=` Searches for students
11. Handler 2: `/api/students/<student id>/attempts` Gets a student attempts
12. A search function should be defined to join auth.users with public.users (public.users has no email field)
13. New pages should have a fade in animation similar to the exam view pages
14. Both the attempt list and the attempt detail view must show the attempt's exam state (in-progress vs.
    completed) so a supervisor can tell at a glance whether an attempt is finished. Score-derived fields
    (pass/fail badge, correct/incorrect breakdown) are only meaningful for a completed attempt and must not be
    presented as final results while an attempt is still in-progress.
15. The attempt detail view shows Correct and Incorrect counts only; unanswered questions are counted under
    Incorrect. These counts are derived from the stored `score` percentage (`correct = round(score × total /
100)`, `incorrect = total - correct`), since per-question correctness is not persisted server-side — only
    the score is. This can be off by ±1 question due to rounding; that is accepted.

GENERAL CONSTRAINTS:

1. All new screens must be responsive, following a mobile-first approach
2. The added components should support RTL without trasnlating yet (only use inline rather than left/right)
3. All pages should handle any errors if the request has failed (not 2xx)
4. Should prefer reusing existing UI components, even if that means exporting the source into a configurable component then configuring it in the calling files
5. The feedback provided should be intuitive and support user experience
6. UI messages must be reused from language files if they exist. Only create new keys and values if the message is totally new.
7. Prefer existing app styling and theme over Figma's inventions
8. Reuse existing attempt services rather than building from scratch
9. Validation follows the existing hand-written `AppError`-throwing validator style already used across
   `api/_lib/validators/` (not Zod — Zod is not a dependency of this project, and every existing validator in
   this codebase is hand-written; introducing Zod here would add a second validation idiom for two small
   endpoints). UUID checks reuse the `uuid` npm package's `validate()` rather than a hand-rolled regex, per
   the standing preference for ready-made packages over self-implemented checks.
10. Variable naming must be explicit and self-describing, no weird shortcuts, optimize for readability
11. Any overlay cards must be scrollable after a specific height is reached rather than covering the page's content. While still having the card's header & close button (if there) on top, not as part of the scrollable content
12. Use "account deactiviation" rather than "subscription expires" wording for the user's account expiry display
13. The `/api/students` search RPC (`public.search_students`) is authored and owned by the project maintainer,
    not generated as part of this feature's implementation. Implementation code only depends on its contract:
    `search_students(p_query text, p_limit integer) RETURNS TABLE (id uuid, first_name text, last_name text, email text, expires_at timestamptz)`.

OUT OF SCOPE: 

- Supervisor-student relationship or checks
- Cross-language search or translations
- Name normalization; acceptable as exact value search 

EDGE CASES: 

- If the user doesn't have permission to access the page (not a user), redirect to /app

 
Do not begin implementation until you have confirmed your understanding of the acceptance criteria.
