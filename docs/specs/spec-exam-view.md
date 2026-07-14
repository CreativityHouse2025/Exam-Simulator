FEATURE: Supervisor can view exams in the system

DESIGN REFERENCE: Figma Make "https://www.figma.com/make/5Trs1m1PSXMVG3DUye7B49" is the base for component behavior, layout, UX, and flow. Where this spec explicitly states something different from that design, this spec takes priority.

User Story: 
As a supervisor, I would like to view the exams in the system (as well as their details, questions, answers. etc.) without having to take an actual attempt.

OVERVIEW:
Allow users with a supervisor role to have the authority to view any exam's overall details and question details (including correct answers) without starting an actual attempt

ACCEPTANCE CRITERIA: 
1. The coverpage should be renamed to "dashboard", and should have a base wrapper that is shared between both roles, and should have new SupervisorDashboard and StudentDashboard that inherit from the base one (students get normal cover page with all exam actions, supervisors get new view exams and search students bttons, sample design is at Figma Make, see DESIGN REFERENCE above)
   - 100% shared between both dashboards: Creativity House title and image.
   - Injected via inheritance/props: subtitle, buttons.
   - Buttons component itself is shared/reused between both roles (same component, different label/behavior per role) — not two separate implementations.
   - Supervisor gets 2 buttons: "View Exams" (in scope, routes to the exams list) and "Search Students" (renders in this feature, but is a stub — no onClick destination; the search-students feature itself is a future spec).
   - Route stays `/app` for the dashboard (no path rename), only the component/file is renamed.
2. Two new pages added for supervisors: exams view (all exams in the system), and questions view (call it ExamDetailPage) (for an exam) strictly following the components behavior, layout, UX, and flow design in Figma (see DESIGN REFERENCE above). (theme of the app is still the source of truth, not figma inventions)
   - Routing: `/exams` (list, no params) and `/exams/:type/:id` (detail, path params — `type` is `full`|`domain`).
   - Invalid/tampered `:type`/`:id` (bad type, non-existent id, non-numeric id) → do NOT redirect; stay on the route and render an inline "not found" empty state (validate against the loaded categories/full-exams lists before attempting any question-file import).
   - If a listed exam's question-data file is missing or empty (`loadFullExam`/`loadDomainExam` throws or returns an empty array) → same inline empty state as the invalid-params case, not an uncaught error/error boundary.
   - Data source is the existing static JSON only (`full-exams.json`, `categories.json`, `exam-types.json` for pass rates/duration, and the per-exam question files under `src/data/exam/full|domain/<lang>/<id>.json`). No backend/API involvement, consistent with OUT OF SCOPE.
   - The exams-list page only ever loads the 3 light config files (`categories.json`, `full-exams.json`, `exam-types.json`) — it never touches per-exam question data. Opening a specific exam (ExamDetailPage) is the only place a question-data file is loaded, matching AC8.
3. Both pages should include the functionality to export list of exams/questions as a CSV.
   - Stub only for this iteration: render the export button, no export logic wired up yet.
4. Questions page must show 10 questions at a time.
5. Both pages should have a search bar on top, can search for an exam title or a question's text
   - Exams-list search bar: matches exam title only (it only has the 3 light files loaded — no question text available to search there).
   - ExamDetailPage search bar: matches question text only (not choices, not explanation).
   - ExamDetailPage search filters the full question set (not just the visible page) and re-paginates the filtered results at 10-per-page; the navigator's number picker reflects the filtered set. Clearing the search restores the full list.
   - Per the design reference: the search bar must not live in the same card as the question navigator/number picker — it's a separate element. Choices are expanded by default; explanations are collapsed by default; each is independently collapsible per question; a single "Expand all" / "Collapse all" control toggles both choices and explanations together for every question. Only the exam title becomes sticky when scrolling past the exam header (not the whole header). Paginating to a new set of 10 questions scrolls the view back to the top.
6. Have a new RoleGaurd that takes a list of roles to allow entry to a page, otherwise redirect to /app 
   - Wraps only the two new routes (`/exams`, `/exams/:type/:id`), inside the existing `ProtectedRoute` tree (not `SessionProvider` — that's student-only). `allowedRoles=['supervisor']`.
   - This is a role check (redirect to `/app`), distinct from the invalid-params case in AC2 (which is an inline empty state, not a redirect).
7. Create the English version of new components first, add translation later in the process after initail approval.
   - "English first" applies to UI chrome only (button labels, headers, search placeholder, empty-state copy) — these stay hardcoded English, with translation keys added in a later pass.
   - Exam/category/question content already exists bilingually in the JSON data (e.g. `categories.json` has `en`/`ar` names). Display that content in whatever language `settings.language` is currently set to — no reason to withhold data that's already there.
   - Page layout/direction follows `settings.language` (`dir="ltr"`/`dir="rtl"`) like the rest of the app — only the copy stays hardcoded English for now, per general constraint 2 below.
8. Should optimize for best performance since we are loading a file each time a supervisor opens a new exam.
   - Cache loaded exam question data in memory for the session using `@tanstack/react-query` (already a project dependency), keyed by `type`+`id`. Re-opening the same exam within the same supervisor session should not re-trigger the dynamic import. Cache does not need to persist across page refresh/logout.

GENERAL CONSTRAINTS:
1. All new components should use shadcn + tailwind, this is a new package introduce to this system, new components should build using it (while still customizing to match the existing theme).
   - Tailwind latest version via the `@tailwindcss/vite` plugin (CSS-first config, no `tailwind.config.js`). shadcn CLI initialized pointing at a new `src/components/ui/` (or similar) directory.
   - Tailwind's Preflight (base reset) must be turned OFF — it's global CSS once imported and would otherwise reset default browser styling on existing styled-components pages. New shadcn components style themselves explicitly to match the app theme without relying on Preflight.
   - This is the first step of a planned future full migration of the app to tailwind + shadcn; existing components are not touched in this feature (see OUT OF SCOPE).
2. The added components should support Arabic and RTL
   - Direction follows `settings.language` now, same as the rest of the app — only the copy is hardcoded English for this pass (see AC7). Use logical CSS/Tailwind properties (`ps-`/`pe-`/`ms-`/`me-`, `text-start`/`text-end`) instead of physical ones (`pl-`/`pr-`/`ml-`/`mr-`), so the layout already flips correctly under `dir="rtl"`; only a translation pass is needed later.
3. Should prefer reusing existing UI components, even if that means exporting the source into a configurable component then configuring it in the calling files
4. The feedback provided should be intuitive and support user experience
5. UI messages must be reused from language files if they exist. Only create new keys and values if the message is totally new.
6. Prefer existing app styling and theme over Figma's inventions

OUT OF SCOPE: 
- Any new student pages or backend modification or new API callers in the frontend.
- Don't refactor existing components to use tailwind + shadcn, only new ones use it.
- CSV export logic (buttons render as stubs only this iteration).
- "Search Students" feature itself (button renders, no destination).
 
EDGE CASES: 
- If no exams or questions available, show a clear UI feedback message.
- No users with a student role should access those pages (frontend gate only, exams are frontend facing)
- Invalid/tampered route params or a listed-but-missing exam file → inline empty state on the page (see AC2), not a crash or redirect.
 
Do not begin implementation until you have confirmed your understanding  
of the acceptance criteria.
