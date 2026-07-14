FEATURE: Supervisor view student attempts

User Story: 
- As a supervisor, I would like to have the permission to search for a student by name/email and see the results, and choose a student to see all of his attempts, and see a specific attempt's deatils.

OVERVIEW:
Allow users with a supervisor role to have the authority to access any student's attempts in the system, while disallowing any other users to do so.

OVERALL ACCEPTANCE CRITERIA: 
1. The coverpage should have a button that takes supervisors to the search page
2. The search page should have a search bar that accepts email/name
3. The search bar should submit a request to find the email or name of the student after 300ms user stops typing (Auto search). 
4. The search has 4 UI states: idle (prompt to start typing), loading (skeleton), populated (data view, table), empty (UI feedback of no results found)
5. The screens design should follow Figma Make's design at "www.figma.com/make/5Trs1m1PSXMVG3DUye7B49" without strictly following any code or debugging components (only styling and design)
6. 

GENERAL CONSTRAINTS:
1. All new screens must be responsive, following a mobile-first approach
2. The added components should support Arabic and RTL
3. All pages should handle any errors if the request has failed (not 2xx)
4. Should prefer reusing existing UI components, even if that means exporting the source into a configurable component then configuring it in the calling files
5. The feedback provided should be intuitive and support user experience
6. UI messages must be reused from language files if they exist. Only create new keys and values if the message is totally new.
7. Prefer existing app styling and theme over Figma's inventions

OUT OF SCOPE: 
- Supervisor-student relationship or checks
 
EDGE CASES: 
- If the user doesn't have permission to access the page (not a user), redirect to /app
 
Do not begin implementation until you have confirmed your understanding  
of the acceptance criteria.
