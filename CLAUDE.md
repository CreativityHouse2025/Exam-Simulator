# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Simulator is a bilingual (Arabic/English) PMP exam practice application built for Creativity House. It supports full 180-question predefined exams (with some exams more or less than 180), category exams (all questions from a selected PMP domain), and a retry session for incorrect/unanswered questions.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm test          # Run Mocha test suite (test/**/*.test.js)
npm run format    # Format code with Prettier
```

## Technology Stack

- React 19 + TypeScript with Vite (SWC)
- Styled Components for CSS-in-JS
- React Context API for state (split into 5 contexts for performance)
- Vercel serverless functions (`/api`) for email sending and v2.0 backend features
- Mantine hooks for localStorage persistence

## Architecture

### Factory Pattern for Exam Generation
`src/utils/ExamFactory.ts` creates exam strategies:
- `FullExam` - 180 predefined questions from `full-exams.json`, fixed order per exam
- `CategoryExam` - all questions from a selected PMP domain category
- Configuration in `exam-data/exam-types.json` (durations, passing rates)

### Split Context Architecture
Contexts are separated to minimize re-renders:
- `ExamContext` - Current exam questions (read-only)
- `SessionNavigationContext` - Current question index
- `SessionTimerContext` - Time tracking
- `SessionExamContext` - Exam state (in-progress, completed, review)
- `SessionDataContext` - Answers, bookmarks, email sent flag
- `SettingsContext` - Language, user info (localStorage-backed)

### Session Reducer
`src/utils/session.ts` handles immutable state updates with typed actions (SET_INDEX, SET_ANSWERS, SET_TIME, SET_TIMER_PAUSED, etc.).

### Custom Hooks
- `useSession()` - localStorage persistence with cleanup
- `useSettings()` - Gets/updates the user settings in the local storage.
- `useResults()` - Score calculation and statistics
- `useEmail()` - Sends exam summary report email (no attachment) via Vercel serverless function
- `useMediaQuery()` - Responsive breakpoints (768px mobile threshold)
- `useFullExamLabel()` - Gets the full exam label from the `full-exams.json` file during the runtime.
- `useCategoryLabel()` - Gets the category label from the `categories.json` file during the runtime.
- `useToast()` - Hook to show/close a toast from the top of the app, toast component is defined in the main.tsx.

### Dynamic Imports
Language files and questions are dynamically imported per language for code-splitting:
```typescript
import(`./data/langs/${langCode}.json`)
```

## Key Directories

- `src/components/Navigation/` - Main exam interface with drawer, footer, timer
- `src/components/Content/` - Question rendering, results summary
- `src/data/exam-data/` - Question banks, exam definitions, categories
- `src/data/langs/` - Translation JSON files (ar.json, en.json)
- `api/send-email.ts` - Vercel serverless function for exam summary email
- `api/` - Additional serverless functions for v2.0 backend (not yet implemented)
- `test/` - Mocha tests for exam logic validation

## Internationalization

- Languages: Arabic (RTL) and English (LTR)
- HTML `dir` attribute set per language

## Code Style

- Prettier: 120 char line width, 2-space indent, no semicolons
- TypeScript strict mode
- Functional components with hooks
- Styled Components for scoped CSS
- Components should always be created with a mobile-first approach that makes them responsive for all devices
- Should use the theme defined in the constants.ts file for creating components

## Workflow
After completing any coding task, update `todo.md` in the project root with the next steps if applicable. Keep entries concise and actionable.