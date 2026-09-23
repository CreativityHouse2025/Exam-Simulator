# GOAL: Eliminate styled-components; Tailwind + shadcn only

## Current state (verified, do not re-derive)
- 60 files in `src/` import `styled-components`; ~210 `styled.*` declarations; 3 `*Styles.ts` files.
- `src/components/SharedStyles.ts` (372 lines, 26 exports) backs all auth pages.
- 6 files already use Tailwind and carry the `.tailwind-page` class.
- Zero tests. No visual baseline. `npm run verify` does not exist yet.
- `styled-components`, `polished`, `@styled-icons/material`, `@styled-icons/boxicons-solid`
  are used ONLY under `src/`. Nothing in `api/` touches them.

## Phase 1 — remove styled-components

Branch: `git switch -c refactor/tailwind-migration` from `developer`.
**Never run `git commit`.** Leave all work uncommitted in the working tree.

### Definition of done
1. `grep -rn "styled-components" src/` returns nothing.
2. `src/index.css` imports `tailwindcss/preflight.css` into `layer(base)`; the hand-written
   `@layer base` Preflight substitute and the `.tailwind-page` class are deleted, and the class
   is removed from all 6 current call sites.
3. `html { font-size: 10px }` is gone. Root is the browser default 16px. The px restatements of
   `--spacing`, `--text-*`, `--radius-*`, `--container-*` in `@theme` are deleted (Tailwind's rem
   defaults are correct again at a 16px root). `--breakpoint-*` was always fine — leave it.
4. `DEFAULT_THEME`, `ThemeProvider`, `GlobalStyle` and the `ThemedStyles` type no longer exist.
   `GlobalStyle`'s non-styled content (body margin/padding, `direction: inherit`, scrollbar
   styling, `.no-select`) has moved into `src/index.css`.
5. `@theme` in index.css is the single token source. Before migrating, audit which of
   DEFAULT_THEME's 15 greys / 25 shadows are actually referenced and add ONLY those as
   `--color-grey-*` / `--shadow-*`. Unused tokens are not ported.
6. `npm uninstall styled-components polished @styled-icons/material @styled-icons/boxicons-solid`
   succeeds and the app builds.
7. `npm run verify` exists (`"verify": "npm run typecheck && npm run lint && npm run build"`) and passes.
8. `docs/refactor/phase-1-report.md` exists and is complete (see **Reporting** below).

### Parity bar
Visually equivalent, NOT pixel-exact. Same layout, colors, font, spacing rhythm, responsive
behavior. 1–2px shifts from Preflight/border-box are acceptable and must not be chased.
**No redesign**: no new colors, no new spacing system, no component reshaping, no RTL "fixes."

### Conversion rules
- **Arbitrary values are banned.** No `p-[13px]`, no `text-[1.3rem]`. Spacing may use v4 dynamic
  multiples (`p-3.25` = 13px). Font-size, radius and shadow snap to the nearest named token.
  Every snap is logged in the phase report under `## DELIBERATE DEVIATIONS`
  as `file | property | old | new`.
- **rem conversion, until the flip:** declarations resolve against the 10px root, so
  `1.4rem` = 14px. **Media queries do not.** `@media (min-width: 48rem)` is **768px = `md:`**,
  not 480px. There are 7 such queries — converting them by ×10 breaks every responsive layout.
  `480px` has no default breakpoint; use `min-[480px]:`. `1024px` = `lg:`.
- **Directional props:** keep physical as physical (`margin-right` → `mr-`), keep logical as
  logical (`margin-inline` → `mx-`/`ms-`/`me-`). Do not convert one to the other.
- **`polished`:** `lighten`/`darken`/`transparentize` calls become precomputed hex values added
  as named `@theme` tokens. `src/utils/color.ts` currently returns a color *string* from
  `lighten()` for the drawer grid — it must return a Tailwind class name instead, and its
  consumer updated.
- **Icons:** all `@styled-icons/*` usage (25 files) migrates to `lucide-react`. Nearest visual
  equivalent; log every mapping that isn't obvious under `## DELIBERATE DEVIATIONS`.
- **Keyframes:** the 22 `keyframes` blocks use `tw-animate-css` utilities where an equivalent
  exists, otherwise a plain `@keyframes` in index.css.
- **Convert a component's whole subtree in one go.** styled-components emit *unlayered* CSS,
  which beats any Tailwind utility regardless of specificity. A half-converted tree where a
  styled parent targets descendants will silently override the new Tailwind classes.

### Batches (one coherent UI area at a time, verify after each)
1. Token audit + `@theme` extension + `npm run verify` script.
2. Auth pages + `SharedStyles.ts` (SignIn, SignUp, ForgotPassword, ResetPassword, ConfirmationCard).
3. App shell (`App.tsx`, `Header.tsx`, `HomePage`, `Loading`, `Toast`, `SyncOverlay`, `Modal`).
4. `exam/shared/*` (Choice, Question, Explanation, Progress, Layout, Footer, Drawer, BookmarkButton, SaveButtonWithReminder).
5. `exam/full/*` (incl. break modals + Timer).
6. `exam/domain/*`.
7. `exam/revision/*`.
8. `attempt-history/*` + `AttemptHistoryPage` + `ProfilePage` + `exam-dropdown/*`.
9. **Final flip** (all of items 2–6 in Definition of done, in one pass), then re-audit the 6
   pre-existing Tailwind pages and `src/components/ui/*` — remove any patch that only existed to
   compensate for missing Preflight, e.g. `border-border` on button's `outline` variant.

### When blocked
Skip the component, leave it as-is, record it in the phase report under `## BLOCKED` with the
reason and proposed options, and continue. Report the blocked list at the gate. Do not halt.

### STOP 1
After batch 9 and a green `npm run verify`: **halt.** Do not start phase 2. Finalise
`docs/refactor/phase-1-report.md` and print its `## BLOCKED` and `## UNRESOLVED RISKS` sections
verbatim in the final message, plus the list of routes to eyeball (every route × ar/en ×
mobile+desktop). Wait for explicit instruction to proceed.

## Phase 2 — handwritten components → shadcn

Branch: cut from `developer` after phase 1 is merged. Again, **no commits.**

Replace every handwritten component with its shadcn/Radix equivalent, including behavioral ones:
`Modal`→Dialog, `Toast`→Sonner, `Dropdown`→DropdownMenu, `Drawer`→Sheet, `AttemptHistoryTable`→Table,
plus Button, Input, Label, Badge, Skeleton, Card, Progress, Separator, Tabs.
Where a primitive's API differs from the existing call sites, add a thin wrapper under
`src/components/<feature>/` rather than changing every consumer. Record in
`docs/refactor/phase-2-report.md` every call-site API that changed — `ToastContext`'s public API
changes app-wide, and that belongs under `## UNRESOLVED RISKS` since nothing verifies it.

**Purity rule:** pull primitives with `npx shadcn add <name>`. Files under `src/components/ui/`
stay as the CLI emits them except (a) color/radius classes repointed at our `@theme` tokens, and
(b) an added CVA variant when a call site genuinely needs one. No structural JSX changes, no added
props, no hooks inside a primitive. Everything else goes in a wrapper.

### STOP 2
`npm run verify` green: finalise `docs/refactor/phase-2-report.md`, then halt with a second review
list, emphasising behavioral surfaces (exam drawer during a live timed session, break modals,
toasts, dropdowns, focus return, scroll lock).

## Reporting

Each phase writes exactly one report: `docs/refactor/phase-1-report.md`,
`docs/refactor/phase-2-report.md`. Create `docs/refactor/` if absent. The report is
**append-only and updated at the end of every batch**, not written once at the gate — if the
session dies mid-phase, everything learned so far must already be on disk.

The report is not a changelog. Its purpose is to surface what the human must decide. Anything the
agent noticed and **did not act on** goes in it — silence about a known problem is a failure of
this goal. Required sections, in this order:

```markdown
# Phase N report — <title>
_Last updated: <date> · batches complete: N/9_

## BLOCKED
Things skipped entirely, still needing a decision. One entry each:
**<file:line>** — what it is · why it couldn't be converted cleanly ·
options considered · what I recommend · what breaks if you do nothing.

## UNRESOLVED RISKS
Things I DID change but cannot verify, or changed in a way that may differ at runtime.
Behavior changes, API changes, anything relying on an assumption I could not test.
State plainly: what I assumed, how it fails if the assumption is wrong, how to check it.

## PRE-EXISTING DEFECTS FOUND
Bugs, dead code, duplicated logic, wrong values I came across and deliberately did NOT touch
because they are outside this goal's scope. File, what's wrong, why I left it.

## DELIBERATE DEVIATIONS
Token snaps (`file | property | old | new`), non-obvious icon substitutions, spacing rounding,
anything where the new render is knowingly not identical to the old one.

## REVIEW CHECKLIST
Every route × language × breakpoint to eyeball, ordered by how likely it is to be wrong,
with the specific thing to look for on each.

## FOLLOW-UPS
Work this refactor created but deliberately left undone (e.g. the deferred skill/doc rewrite).
```

Rules for the report:
- No entry may be a bare filename. Every entry says what breaks and what the human must decide.
- An empty section stays in the file with `_None._` — absence must be explicit, not implied.
- Do not soften findings. If a conversion is a guess, call it a guess.

## Overrides — read this before obeying the skills
`.claude/skills/styling-guide.md` describes the **pre-refactor** state. Its constraints
(1) "Preflight is OFF and stays off", (2) "every Tailwind page root needs `.tailwind-page`",
(3) the px `@theme` restatements — are **exactly what phase 1 exists to remove.** Do not obey
them during the final flip. Constraint (4) (shadcn via CLI) still holds. Do **not** update any
skill, CLAUDE.md, or anything under `docs/specs/`; those updates are deliberately deferred to a
separate task — record them under `## FOLLOW-UPS` instead. The two phase reports under
`docs/refactor/` are the only documentation this goal authorises you to write.

## Non-goals
Redesign. RTL behavior changes. New features. Test infrastructure. Touching `api/`,
`supabase/`, or `src/data/`. Removing pre-existing dead code you didn't orphan.
