# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Simulator is a bilingual (Arabic/English) PMP exam practice application built for Creativity House. It supports full 180-question predefined exams (with some exams more or less than 180), category exams (all questions from a selected PMP domain), and a retry session for incorrect/unanswered questions.

## Commands

```bash
npm run dev       # Start Vite dev server with hot reload
vercel dev        # Start Vercel dev server that enables /api endpoints
npm run build     # Production build to dist/
npm run preview   # Preview production build locally
npm run format    # Format code with Prettier
npm run typecheck # Type-check the entire project (tsc --build + vite config)
```

## Technology Stack

- React 19 + TypeScript 5.9 with Vite (SWC)
- Styled Components for CSS-in-JS
- React Context API for state (split into 5 contexts for performance)
- Vercel serverless functions (`/api`) for email sending and v2.0 backend features
- Mantine hooks for localStorage persistence

## Backend and Frontend Architecture

All API endpoints follow a three-layer pattern:

- **Handler** (`api/*.ts`): parses and validates the request, calls the service, returns the HTTP response. No business logic.
- **Service** (`api/_lib/services/`): contains all business logic. No knowledge of HTTP — no `req`, `res`, or status codes.
- **Validation** (`api/_lib/validators/`): pure functions that validate and parse request input. Called by the handler before the service.

Keep handlers thin. If logic can be unit tested without mocking an HTTP request, it belongs in the service.

### Split Context Architecture (React)
Contexts are separated to minimize re-renders:
- `ExamContext` - Current exam questions (read-only)
- `SessionNavigationContext` - Current question index
- `SessionTimerContext` - Time tracking
- `SessionExamContext` - Exam state (in-progress, completed, review)
- `SessionDataContext` - Answers, bookmarks, email sent flag
- `SettingsContext` - Language, user info (localStorage-backed)

### Session Reducer (React)
`src/utils/session.ts` handles immutable state updates with typed actions (SET_INDEX, SET_ANSWERS, SET_TIME, SET_TIMER_PAUSED, etc.).

### Custom Hooks (React)
- `useSession()` - localStorage persistence with cleanup
- `useSettings()` - Gets/updates the user settings in the local storage.
- `useResults()` - Score calculation and statistics
- `useEmail()` - Sends exam summary report email (no attachment) via Vercel serverless function
- `useMediaQuery()` - Responsive breakpoints (768px mobile threshold)
- `useFullExamLabel()` - Gets the full exam label from the `full-exams.json` file during the runtime.
- `useCategoryLabel()` - Gets the category label from the `categories.json` file during the runtime.
- `useToast()` - Hook to show/close a toast from the top of the app, toast component is defined in the main.tsx.

### Dynamic Imports (React)
Language files and questions are dynamically imported per language for code-splitting:
```typescript
import(`./data/langs/${langCode}.json`)
```

## Key Directories

- `src/components/Navigation/` - Main exam interface with drawer, footer, timer
- `src/components/Content/` - Question rendering, results summary
- `src/data/exam-data/` - Question banks, exam definitions, categories
- `src/data/langs/` - Translation JSON files (ar.json, en.json)
- `api/_lib/types.ts` - Shared backend types
- `api/_lib/utils/responses.ts` - Used to return a failure and success structure response for APIs
- `api/_lib/errors/AppError.ts` - Custom error class for structured API errors
- `api/_lib/middleware/*` - Has HOFs that wraps handlers with consistent error formatting and authentication assertion
- `api/_lib/validators/authValidator.ts` - Input validation for auth endpoints (throws `AppError` on failure)
- `api/_lib/services/subscriptionVerifier.ts` - Verifies user has an active HighLevel subscription before signup

## Internationalization

- Languages: Arabic (RTL) and English (LTR)
- HTML `dir` attribute set per language
- Uses a map in memory and functions to populate UI values

## TypeScript Configuration

Project uses split tsconfig with project references to separate frontend and backend environments:

- `tsconfig.json` - Root config with shared options, references `app` and `api`
- `tsconfig.app.json` - Frontend (`src/`): `bundler` module resolution, DOM types, JSX, `noUnusedLocals`/`noUnusedParameters` enabled
- `tsconfig.api.json` - Vercel serverless (`api/`): `Node16` module resolution, no DOM types. Relative imports must use `.js` extensions (Node ESM requirement)
- `tsconfig.vite.json` - Vite config only: `bundler` resolution, `allowJs`, `noEmit`. Not a project reference (checked separately via `tsc -p`)

## Code Style

- Prettier: 120 char line width, 2-space indent, no semicolons
- TypeScript strict mode
- Functional components with hooks
- Styled Components for scoped CSS
- Components should always be created with a mobile-first approach that makes them responsive for all devices
- Should use the theme defined in the constants.ts file for creating components
- Always document newly created major components with JSDoc comments
- Errors throwed from backend are parsed in the frontend using the error code

## Workflow
- After completing any coding task, update `todo.md` in the project root with the next steps if applicable. Keep entries concise and actionable.
- After completing major changes in the app's architecture/components, update this `CLAUDE.md` file to match it.
- If you notice there are repeatable work that needs context to start with