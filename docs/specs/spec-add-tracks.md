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
