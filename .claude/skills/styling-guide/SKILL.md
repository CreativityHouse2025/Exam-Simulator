---
name: styling-guide
description: "The rules that make Tailwind v4 and styled-components coexist in the Exam Simulator without breaking each other — Preflight is disabled on purpose, the root font-size is 10px so every Tailwind page root needs .tailwind-page, dark: variants are deliberately inert, and shadcn primitives come from the CLI. Use this skill before writing or editing ANY styling: Tailwind classes, styled-components, src/index.css, theme values, a shadcn/ui primitive, or a new page layout. Also use whenever Tailwind 'looks broken' — serif text, underlined links, OS-chrome buttons, a near-black outline border, content overflowing its container, or styling that only breaks on a dark-mode machine. Do not improvise CSS in this repo; nearly every styling bug here traces back to one of these four constraints."
---

# Styling Guide (Tailwind v4 + styled-components)

## Overview

Two styling systems are live in the same app. New UI (supervisor pages, shadcn primitives) is
Tailwind v4; old UI is styled-components. That coexistence forces four non-obvious constraints.
**Nearly every "Tailwind looks broken" bug in this codebase traces back to one of them** — so
recognise the symptom and apply the known fix rather than re-diagnosing from scratch.

## 1. Preflight is OFF, and stays off

`src/index.css` imports only `tailwindcss/theme.css` and `tailwindcss/utilities.css` — never
`tailwindcss/preflight.css`. Preflight sets `box-sizing`, `img { display: block }`, and list/table/
border defaults that **nothing in the styled-components pages overrides**, so enabling it globally
reflows the entire existing app.

The cost: browser UA defaults leak into Tailwind markup. `src/index.css` has a hand-written
`@layer base` replacing only the Preflight rules the Tailwind pages actually need. Each rule there
is safe because it is either overridden by an existing styled-component or a no-op for the old pages.

**Cascade layers are what makes this safe, and the rule is per-declaration, not per-file:**
styled-components emit *unlayered* CSS, which beats *any* cascade layer regardless of specificity.
So a layered `base` rule can only ever affect a property that no styled-component declares. Before
adding anything to `@layer base`, confirm the property is already declared by the old components
(or is inert for them). That is exactly why full Preflight is unsafe and the hand-picked subset is not.

Symptoms already hit and fixed — recognise these rather than re-diagnosing them:

| Symptom | Cause |
| --- | --- |
| Serif text / underlined links | No `body { font-family }`, no `a { text-decoration: inherit }` |
| Buttons look like raw OS chrome | UA `background-color: buttonface` + `outset` border |
| An `outline` button has a heavy near-black border | Tailwind defaults an uncoloured border to `currentColor` — always pair `border` with an explicit colour, e.g. `border-border` |
| Content overflows its container | Elements default to `content-box`, but every Tailwind utility assumes `border-box` |

## 2. Every Tailwind page root needs `.tailwind-page`

`GlobalStyle` (`src/main.tsx`) sets `html { font-size: 10px }` (`theme.fontSize`), and ~320 `rem`
values across the styled-components are authored against that root. It cannot be changed to 16px.

Two consequences, both already handled — **do not "fix" them again**:

- Tailwind's default scale is `rem`-based and would render at 62.5%. `src/index.css` restates
  `--spacing`, `--text-*`, `--radius-*` and `--container-*` in **px** so the utilities are
  root-agnostic. `--breakpoint-*` is deliberately left in `rem`: inside a media query, `rem`
  resolves against the browser's initial 16px, not `html`, so breakpoints were never affected.
- The `.tailwind-page` class (defined in `@layer base`) applies `box-sizing: border-box` to a
  subtree and sets a 16px font baseline. **Put it on the root element of every Tailwind-built
  page.** Without it, unsized text inherits 10px and padded elements overflow.

New sizing uses the standard scale (`p-4`, `text-sm`). Never hand-write `rem` values like
`p-[1.2rem]` — those bypass the px scale and silently resolve against the 10px root.

## 3. `dark:` variants never fire

The app is light-only, but the shadcn primitives ship `dark:` classes throughout. Tailwind binds
`dark:` to `prefers-color-scheme: dark` by default, so on a dark-mode machine those variants
activate and override the intended light styling — a bug invisible to anyone developing in light
mode. `src/index.css` rebinds it:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Nothing sets `.dark`, so `dark:` is inert. Leave it that way. Don't strip `dark:` classes out of
primitives either — that fights the CLI on the next update for no benefit.

## 4. shadcn primitives

Pull them with the real CLI, never hand-author them:

```bash
npx shadcn add <name>
```

Prefer fixing a shared defect in the primitive itself (as with `outline`'s missing `border-border`)
over patching each call site — one fix, every consumer. Icons in new UI use `lucide-react`; the
existing `@styled-icons/material` usage in old UI stays as-is.

## Which system for new work

Tailwind + shadcn is the default for new UI. Use styled-components only when extending an existing
styled-components page, and put provider-specific styled components in their own `*Styles.ts` file —
a provider file may only default-export its component (see `frontend-guide` on fast refresh).

Old-UI styled components read design tokens from the theme in `constants.ts` rather than hardcoded
values. Build every component mobile-first and responsive across devices.

## Related skills

- **Component structure, where a file goes, provider/export rules → invoke `frontend-guide`.**
- **A supervisor-only page or anything whose visibility depends on role → invoke `auth-rbac-guide`.**
