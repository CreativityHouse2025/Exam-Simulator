## Table of Contents

- [About](#about)
- [Features](#features)
  - [Account Management](#account-management)
  - [Exam Types](#exam-types)
  - [During the Exam](#during-the-exam)
  - [Results & Review](#results--review)
  - [Retry Wrong Answers](#retry-wrong-answers)
  - [Exam Attempt History](#exam-attempt-history)
  - [Email Report](#email-report)
  - [Language Support](#language-support)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Local Development](#local-development)
- [Roadmap](#roadmap)

---

## About

A bilingual (Arabic/English) PMP exam simulator built for [Creativity House](https://creativity-house.com), a Malaysian company that prepares professionals for the PMP certification exam.

Web app (Private Users): https://exam-simulator-flax.vercel.app

---

## Current Version: v2.0

v2.0 introduced a full backend layer, user authentication, and subscription-gated access. The app moved from a frontend-only tool to a multi-user platform with accounts, access control, and persistent exam history.

---

## Features

### Account Management

- **Sign up** using a Creativity House offer email. Registration is gated — only users with an active subscription can create an account.
- **Sign in / Sign out** with email and password.
- **Forgot password** and **reset password** flows via email.
- **Single-device session enforcement** — each account can only be active on one device at a time. Signing in on a new device ends the previous session. Enforced by Supabase Auth's *Single session per user* setting, not by application code.
- **Subscription expiry** — access is automatically revoked when a user's subscription period ends.

### Exam Types

- **Full Exam:** 180 questions, 230-minute countdown timer, selected from a predefined list.
- **Categorized Exam:** A shorter exam filtered by a PMP domain.

### During the Exam

- Question numbering and progress tracking (remaining and answered count).
- Pause the exam at any time.
- Submit early without completing all questions.
- Switch language (Arabic / English) at any time — question order and session state are preserved.

### Results & Review

- Score displayed as a percentage on completion.
- Full detailed review after submission showing: all answer choices, your selected answer, the correct answer, and the explanation for each question.

### Retry Wrong Answers

- A **Retry** option appears on the results screen.
- The retry session contains only the incorrect and unanswered questions, in their original order.
- Retry results are tracked separately and do not affect the original exam score.

### Exam Attempt History

- A dedicated **History page** shows the last 10 attempts for the signed-in user, including in-progress and completed sessions.
- Each row display the attempt details
- Clicking a completed attempt opens a full **Attempt Review page** showing the answers, correct choices, and explanations — read-only, no timer.
- Clicking an in-progress attempt resumes the exam.

### Email Report

- On exam completion, a report is automatically sent to the user's email.

### Language Support

- Full Arabic and English support throughout the simulator.
- Report and email language matches the language selected before exam completion.

---

## Screenshots

### Sign In / Sign Up

Authentication screens with subscription gating.

![alt text](docs/signup.png)
![alt text](docs/signin.png)

### Home / Exam Selection

Full and categorized exam type selection with dropdowns.

![alt text](docs/cover-page.png)

### Exam Session

Active exam with timer, progress bar, and question navigation.

![alt text](docs/exam.png)

### Results Summary

Score, pass/fail badge, and breakdown by correct/incorrect/unanswered.

![alt text](docs/summary.png)

### Attempt History

Table of past attempts with state and score at a glance.

![alt text](docs/attempt-history.png)

### Email Report

HTML email report sent to the user's inbox.

![alt text](docs/report.png)
---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript |
| Styling | Tailwind CSS v4, shadcn/ui (on `radix-ui`), `lucide-react` icons |
| State Management | React Context API (5 split contexts) |
| Backend | Vercel Serverless Functions (`/api`) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| CRM Integration | HighLevel (subscription verification) |
| Hosting | Vercel |

---

## Local Development

The entire backend — Postgres, Auth, Storage, Studio and a fake SMTP inbox — runs locally in
Docker via the Supabase CLI. There is no shared remote development database.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/), installed and running
- Node.js 20+

The Supabase CLI ships as a devDependency, so there is nothing to install globally.

### First run

```bash
npm install
npm run db:start          # boots the stack (first run pulls ~10 images, this takes a while)
cp .env.example .env      # then paste the values printed by the previous command
npm run db:reset          # applies every migration and loads the seed data
npx vercel dev            # serves the app at http://localhost:3000, including /api
```

`npx supabase status -o env` reprints the URL and keys at any time.

> `npm run dev` runs Vite alone and does **not** serve `/api`. Use `vercel dev` for anything that
> talks to the backend.

### Daily commands

| Command | What it does |
|---|---|
| `npm run db:start` | Start the local stack |
| `npm run db:stop` | Stop it, keeping the data |
| `npm run db:reset` | Wipe, replay all migrations, reload `supabase/seed.sql` |
| `npm run db:types` | Regenerate `api/_lib/database.types.ts` from the local schema |

### Services

| Service | URL |
|---|---|
| API | http://127.0.0.1:54321 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Studio | http://127.0.0.1:54323 |
| Inbucket (captured emails) | http://127.0.0.1:54324 |

### Seeded accounts

Every seeded account uses the password `password123`.

| Email | Role |
|---|---|
| `supervisor@local.test` | Supervisor |
| `student@local.test` | Student (with exam attempt history) |
| `amira.hassan@example.com` and 9 others | Students, for testing student search |

### Known local limitations

- **Sign-up does not work offline.** It verifies a paid offer against the live HighLevel CRM and
  needs `HIGHLEVEL_PRIVATE_INTEGRATION_TOKEN` and `HIGHLEVEL_SUBACCOUNT_LOCATION_ID`. Sign in with
  a seeded account instead.
- **Emails are captured, never sent** — read them in Inbucket.
- **Single-session-per-account is not enforced locally**; it is a hosted Supabase Auth setting.
- **Some schema objects are not in the migrations.** Table grants and the `on_email_confirmed`
  trigger were applied to production through the dashboard, so `supabase/local/bootstrap.sql`
  recreates them locally. It is not a migration — keep it in sync by hand if production changes.

### Adding a migration

Create `supabase/migrations/NNN_name.sql` by hand with the next number, run `npm run db:reset` to
prove it replays from scratch, then `npm run db:types` and commit the regenerated types with it.

---

## Roadmap

| Phase | Description | Status |
|---|---|---|
| 1 | Predefined full exam selection dropdown | Complete |
| 2 | Backend infrastructure (Supabase database setup) | Complete |
| 3 | Authentication + HighLevel CRM integration | Complete |
| 4 | Single-device session enforcement | Complete |
| 5 | Persistent exam attempt history | Complete |
| 6 | Resume unfinished exams | Complete |
| 7 | Show correct answer during category exams | Pending |
| 8 | UI refresh (PMP-style interface) + rename category exam | Pending |
| 9 | Expand predefined full exam list | Pending |
| 10 | Break system (2 × 10-minute breaks at Q60 and Q120) | Pending |
| 11 | Full system testing and production deployment | Pending |

---

## References

Originally built from [Exam Simulator](https://github.com/exam-simulator/simulator) by [Benjamin Brooke](https://github.com/benjaminadk).