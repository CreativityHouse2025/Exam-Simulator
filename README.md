## About

A bilingual (Arabic/English) PMP exam simulator built for [Creativity House](https://creativity-house.com), a Malaysian company that prepares professionals for the PMP certification exam.

Try the webapp here 👉 https://exam-simulator-flax.vercel.app

---

## Current Version: v2.0 (Phase 1)

### What's New in v2.0 — Phase 1

- **Predefined full exam selection:** A dropdown on the home screen lets users select from a list of predefined full exams (180 questions each). All users see the same questions in the same fixed order per exam.

- **Sign up using Creativity House offer email:** A user with an email that has an offer (1st payment of more than 160) can access the system. Otherwise will be unauthorized

---

## Features (as of v1.1)

### Exam Types

- **Full Exam:** 180 questions, 230-minute countdown timer, selected from a predefined list.
- **Category Exam:** A shorter exam filtered by a PMP domain chosen from a dropdown.

### During the Exam

- Question numbering and progress tracking (remaining and answered count).
- Pause the exam at any time.
- Submit early without completing all questions.
- Switch language (Arabic / English) at any time — question order and session state are preserved.

### Results & Review

- Score displayed as a percentage on completion.
  - Pass threshold: **85%** for category exams, **75%** for full exams.
- Full detailed review after submission showing: all answer choices, your selected answer, the correct answer, and the explanation for each question.

### Retry Wrong Answers

- If more than 10 questions were answered incorrectly or skipped, a **Retry** option appears on the results screen.
- The retry session contains only the incorrect and unanswered questions, in their original order.
- Retry results are tracked separately and do not affect the original exam score.

### Email Report

- On exam completion, a report is automatically sent to the user's email.
- The report includes: exam type and category (if applicable), status, correct percentage, time and date, correct, wrong and unanswered questions.
- If the email fails to send, the user is notified and offered a direct PDF download instead.

### Language Support

- Full Arabic and English support throughout the simulator.
- Report and email language matches the language selected before exam completion.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, TypeScript |
| Hosting | Vercel |
| Backend (to be added) | Supabase |

---

## Roadmap — v2.0 Remaining Phases

| Phase | Description | Status |
|---|---|---|
| 1 | Predefined full exam selection dropdown | Complete |
| 2 | Backend infrastructure (Supabase database setup) | Pending |
| 3 | Authentication + HighLevel CRM integration | Pending |
| 4 | Single-device session enforcement | Pending |
| 5 | Persistent exam attempt history | Pending |
| 6 | Resume unfinished exams | Pending |
| 7 | Show correct answer during category exams | Pending |
| 8 | UI refresh (PMP-style interface) + rename category exam | Pending |
| 9 | Expand predefined full exam list | Pending |
| 10 | Break system (2 × 10-minute breaks at Q60 and Q120) | Pending |
| 11 | Full system testing and production deployment | Pending |

---

## References

Originally built from [Exam Simulator](https://github.com/exam-simulator/simulator) by [Benjamin Brooke](https://github.com/benjaminadk).