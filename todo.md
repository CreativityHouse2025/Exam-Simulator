# Todo

Bugs found in backend:
1. attempt handlers don't send refresh cookies (fixed)
2. withAuth doesn't handle the handler's errors internally after refreshing, causing user to lose the refreshed cookies (fixed)

Issues found in frontend:
1. Two calls to start an exam one to save one to get because the cover page can't set the exam or session
2. 

Backend
- [ ] Set up email cron job for exam status email
Frontend
- [ ] Set up caching to reduce exam attempts load
- [ ] CRITICAL: saveAttempt saves display order choices not actual question choices order
- [ ] MEDIUM: first question in PATCH payload has id of undefined for some attempts