---
name: <skill-name>
description: "<When to trigger>. Triggers include: <list specific user phrases, keywords, or intent patterns>. Also use when <edge cases>. Do NOT use for <explicit exclusions to prevent false triggers>."
---

# <Skill Title>

## Overview

<!-- One paragraph: what this skill does and why it exists. -->

## Context

<!-- Project-specific context the skill needs to operate correctly. Reference files, patterns, or conventions from this codebase. Examples: -->
<!-- - Tech stack: React 19, TypeScript, Styled Components, Vite -->
<!-- - State: Split Context Architecture (ExamContext, SessionDataContext, etc.) -->
<!-- - Styling: Styled Components using theme from src/utils/constants.ts -->
<!-- - i18n: Bilingual (ar/en), RTL/LTR via HTML dir attribute -->
<!-- - API: Vercel serverless functions in /api -->
<!-- - Code style: Prettier (120 chars, 2-space, no semicolons), strict TypeScript -->

## Quick Reference

<!-- Table mapping common sub-tasks to the approach/tool/file to use. -->

| Task | Approach |
|------|----------|
| ... | ... |

## Steps

<!-- Numbered steps the skill follows when invoked. Be explicit and sequential. -->

1. **Step name** — What to do and why.
2. **Step name** — What to do and why.

## Rules

<!-- Non-negotiable constraints. Use bullet points. Examples: -->
<!-- - Never use `any` in TypeScript — flag the type issue instead. -->
<!-- - Mobile-first: all components must be responsive (768px breakpoint). -->
<!-- - Use theme values from constants.ts, never hardcoded colors/spacing. -->
<!-- - Follow existing naming conventions in the target directory. -->
<!-- - Do not add features or abstractions not explicitly requested. -->

## Examples

<!-- Concrete before/after or input/output examples so the skill produces consistent results. -->

## Checklist

<!-- Final verification before the skill considers its work done. -->

- [ ] TypeScript compiles with no errors (`npm run build`)
- [ ] No hardcoded strings — uses lang files if user-facing
- [ ] Mobile-responsive
- [ ] Updated todo.md if next steps exist
