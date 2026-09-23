# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Exam Simulator is a bilingual (Arabic/English) PMI certification (currently PMP only, RMP to be added) exam practice application built for Creativity House. It supports full exams (with some exams more or less than 180), domain exams (all questions from a selected domain of a certificate), and a retry client-side session for incorrect/unanswered questions.

Two roles use the app: **students** (take exams, review their attempt history) and **supervisors** (browse the exam library, inspect individual questions, run ephemeral preview sessions, search students and read their attempts). See `docs/specs/` for the written specs behind these features.

## Skill routing — read the matching skill BEFORE you write code

Detailed architecture lives in skills under `.claude/skills/`, not in this file. Each one documents
constraints that are non-obvious and that fail quietly when improvised. Invoke the skill first; it
costs one tool call and prevents the class of bug it exists to describe.

| Working on | Invoke |
| --- | --- |
| Anything under `src/` — components, pages, hooks, contexts, providers, routes, services | `frontend-guide` |
| Anything under `api/` — endpoints, handlers, services, validators, middleware | `backend-guide` |
| Anything under `supabase/` — migrations, RPCs, schema, generated types | `database-guide` |
| Any CSS, Tailwind class, theme token, shadcn primitive, or new page layout | `styling-guide` |
| Sign-in/out, sessions, cookies, roles, route guards, who-can-see-what | `auth-rbac-guide` |
| Anything under `src/data/` — questions, answers, exams, categories, translations | `exam-data-guide` |
| Running, resetting, or seeding the local Supabase Docker stack; `npm run db:*`; `.env` Supabase values | `local-supabase-guide` |

Tripwires — if any of these describe your task, the skill above is not optional:

- **Writing Tailwind markup** → `styling-guide`. Tailwind v4 is the only styling system here, and
  a design token declared in the wrong block generates no CSS at all — silently.
- **Adding an API endpoint** → `backend-guide` + `auth-rbac-guide`. Access control fails *open* if
  `withRole` is omitted.
- **Fixing a question's answer** → `exam-data-guide`. Question ids are not unique across banks; a
  one-file fix leaves the other copy wrong.
- **Running or resetting the local database** → `local-supabase-guide`. Migrations are replayed by
  `npm run db:reset`, never applied by hand, and `supabase migration new` breaks the `NNN_` numbering.
- **Adding state or a provider** → `frontend-guide`. Contexts are split on purpose and provider
  files may only have a default export.

The skills cross-reference each other; follow the "Related skills" section at the bottom of each
when a task spans layers.

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

- React 19 + TypeScript 5.9 with Vite (React plugin)
- React Router 7 for routing
- Tailwind v4 + shadcn/ui primitives on `radix-ui` for all styling; `lucide-react` for icons
- React Context API for client/session state (split into 5 session contexts for performance)
- TanStack Query for server state (attempt lists, student search, student attempts)
- Supabase (auth + Postgres) behind Vercel serverless functions (`/api`)
- Mantine hooks for localStorage persistence

## Key Directories

```
src/components/exam/{full,domain,revision}/  per-exam-type session trees
src/components/exam/shared/                  reusable exam UI
src/components/ui/                           shadcn/ui primitives
src/components/{exams,tracks,students,attempts,states}/  cross-page feature components
src/pages/<page>/index.tsx                   one folder per route; a page never imports another
src/hooks/examSession/                       exam session facade hooks
src/config/                                  routes.ts, nav.ts, roles.ts, icons.ts
src/data/exam/                               question banks, exam definitions, categories
src/data/langs/                              translation JSON (ar.json, en.json)
src/services/  src/utils/queryOptions.ts     API clients, TanStack Query definitions

api/_lib/{middleware,services,validators,utils,errors}/
api/{auth,attempts,students}/                endpoints

supabase/migrations/                         numbered SQL migrations
supabase/query/                              ad-hoc analytics queries and exports

docs/specs/                                  feature specs
```

## TypeScript Configuration

Split tsconfig with project references separating frontend and backend environments:

- `tsconfig.json` — solution file only (`files: []`), references `app` and `api`. No compiler options — referenced projects don't inherit them
- `tsconfig.app.json` — frontend (`src/`): `bundler` module resolution, DOM types, JSX, `noUnusedLocals`/`noUnusedParameters` enabled
- `tsconfig.api.json` — Vercel serverless (`api/`): `NodeNext` module resolution, no DOM types. Relative imports must use `.js` extensions (Node ESM requirement)
- `tsconfig.node.json` — `vite.config.ts` only: `bundler` resolution, `noEmit`. Not a project reference (checked separately via `tsc -p`)

All projects are type-check only (`noEmit: true`, no `composite`); `tsc --build` writes only `.tsbuildinfo` files to `node_modules/.tmp/`. Nothing is emitted to `dist/` — that directory belongs to `vite build` alone.

## Code Style

- Prettier: 120 char line width, 2-space indent, no semicolons
- TypeScript strict mode
- No explicit `any` allowed
- Must use `unknown` and type-narrow for API/JSON data
- Always aim for dynamically defined types using utility types, generics, indexed access, `keyof`, etc. rather than hardcoded types
- Functional components with hooks
- Components should always be created with a mobile-first approach that makes them responsive for all devices
- Always document newly created major components with JSDoc comments
- Errors thrown from backend are parsed in the frontend using the error code

## Workflow

- After completing major changes in the app's architecture/components, update the relevant skill in `.claude/skills/` — not this file. This file only changes when the project's shape or the routing table changes.
- Git commits: short imperative subject line, e.g. `fix: correct answer shuffle logic`

## Guidelines and Constraints (CRITICAL, SHOULD NEVER OVERLOOK)

### 1. Plan with user Before Coding
Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:

State your assumptions explicitly. If uncertain, ask.
If multiple interpretations exist, present them - don't pick silently.
If a simpler approach exists, say so. Push back when warranted.
If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First
Minimum code that solves the problem. Nothing speculative.

No features beyond what was asked.
No abstractions for single-use code.
No error handling for impossible scenarios.
If you write 200 lines and it could be 50, rewrite it.
Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

### 3. Surgical Changes
Touch only what you must. Clean up only your own mess.

When editing existing code:

Don't "improve" adjacent code, comments, or formatting.
Don't refactor things that aren't broken.
Match existing style, even if you'd do it differently.
If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

Remove imports/variables/functions that YOUR changes made unused.
Don't remove pre-existing dead code unless asked.
The test: Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
Define success criteria. Loop until verified.

Transform tasks into verifiable goals:

"Add validation" → "Write tests for invalid inputs, then make them pass"
"Fix the bug" → "Write a test that reproduces it, then make it pass"
"Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

``` text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

### 5. Reusability and code extraction

Prefer reusing existing logic, components, or styling over starting from scratch, even if needed to refactor the existing code to be more flexible.

### 6. Interfaces
- Define reusable interfaces and create different implementations for parts that you think might be extended later. Aim to maximize extention flexibility rather than hardcoding.

### 7. Ready-made Over Hand-written
- When implementing heavy or repetitive logic rethink whether a trusted npm package already does that and suggest it to the user before starting to hand-write code.