# Todo

Backend
- [ ] Update README.md
- [ ] Integrate the rest of APIs into the application
  - [ ] GET ATTEMPT (REVIEW, CONTINUE)
  - [ ] POST ATTEMPT
  - [ ] SAVE PROGRESS
  - [ ] FINISH ATTEMPT
- [ ] Persist revision attempts to DB: migrate `exam_type` CHECK to allow `'revision'` (or store as `'full'` with `parent_attempt_id` set), add `parent_attempt_id` to `InsertAttemptRequestBody`, wire service + validator
