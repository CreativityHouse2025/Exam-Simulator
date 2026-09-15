---
name: styling-guide
description: "Styling rules for the Exam Simulator — Tailwind v4 is the only styling system, real Preflight is enabled, the root font-size is the browser default 16px, every design token lives in src/index.css, dark: variants are deliberately inert, shadcn/ui primitives come from the CLI and icons from lucide-react. Use this skill before writing or editing ANY styling: Tailwind classes, src/index.css, a theme token, a shadcn/ui primitive, or a new page layout. Also use when Tailwind 'looks broken' — a heading rendering at body text size, a near-black border on a bordered element, styling that only breaks on a dark-mode machine — or when a value seems to have no utility and you are tempted to write plain CSS. styled-components, polished and @styled-icons are gone; nothing in src/ uses them."
---

# Styling Guide (Tailwind v4)

## One system

Tailwind v4 plus shadcn/ui primitives (on `radix-ui`) is the only styling system in `src/`.
styled-components, `polished` and `@styled-icons/*` were removed entirely — there is no
`ThemeProvider`, no `GlobalStyle`, no `DEFAULT_THEME`, no `theme.*` lookup and no `Theme`/
`ThemedStyles` type. Icons come from `lucide-react`. Don't reintroduce any of them.

## Preflight is ON and the root is 16px

`src/index.css` declares the cascade layer order and imports real Preflight:

```css
@layer theme, base, components, utilities;
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css" layer(utilities);
```

So `box-sizing: border-box`, the border/form/media resets and `img { display: block }` apply
globally, to every element. The root font-size is the browser default, so Tailwind's stock rem
scale (`p-4`, `text-sm`, `rounded-lg`) is correct exactly as shipped: nothing restates the scale
in px, and there is no `.tailwind-page` scoping class. Both existed only for the old 10px root
and no longer exist anywhere.

Never hand-author a rem value — not `p-[1.2rem]`, not `style={{ fontSize: "0.9rem" }}`. Use the
scale; it is dynamic, so odd-but-real pixel values are reachable (`p-3.25` = 13px).

On top of Preflight, `@layer base` in `index.css` adds app-wide rules. The one that surprises
people: `h1`–`h6` and `p` are reset to `font-size: inherit; font-weight: inherit; margin: 0`, so
a heading renders at body size until you give it `text-*`/`font-*` classes. `ol`/`ul` are
`list-style: none` with no padding. Also there: `body`'s font and `direction: inherit` (the
per-language `dir` propagates from it), the `::-webkit-scrollbar*` styling, and `.no-select`.

## Design tokens live only in src/index.css

Three blocks, and which one you put a token in matters:

- **`:root`** — raw values: `--primary`/`--secondary`, `--grey-50` … `--grey-1000`, the shadcn
  surface tokens (`--background`, `--border`, `--muted` …), and the precomputed hover/light
  variants that used to be computed by `polished` at runtime (`--primary-light`, `--danger-hover`,
  `--correct-bg` …).
- **`@theme inline`** — the `--color-*` aliases that turn those into utilities (`bg-primary`,
  `text-grey-900`, `border-border`), plus `--font-sans`.
- **`@theme`** — tokens whose value is defined here rather than aliased: `--shadow-1/4/8` and the
  `--animate-*` keyframe tokens.

Tailwind's utility generator only scans `@theme` blocks. **A token defined solely under `:root`
generates no utility at all** — which is why each one needs either a `@theme inline` alias or a
direct `@theme` definition. This fails silently: the class name looks fine and emits no CSS.

Add a new color as a `:root` value plus a `@theme inline` alias. Don't hardcode a hex in markup.

## `dark:` never fires

The app is light-only, but the shadcn primitives ship `dark:` classes throughout, and Tailwind
binds `dark:` to `prefers-color-scheme: dark` by default — on a dark-mode machine those variants
would activate and override the intended light styling, a bug invisible to anyone developing in
light mode. `index.css` rebinds it:

```css
@custom-variant dark (&:where(.dark, .dark *));
```

Nothing sets `.dark`, so `dark:` is inert. Leave it that way, and don't strip `dark:` classes out
of primitives either — that fights the CLI on the next update for no benefit.

## shadcn primitives

Pull them with the real CLI, never hand-author them:

```bash
npx shadcn add <name>
```

Files under `src/components/ui/` stay close to what the CLI emits: color/radius classes repointed
at our `@theme` tokens, and a CVA variant added when a call site genuinely needs one. Anything
else — extra props, hooks, structural JSX changes — belongs in a wrapper under
`src/components/<feature>/`. Prefer fixing a shared defect in the primitive over patching each
call site.

Note that Tailwind resolves an uncolored `border` to `currentColor` (Preflight does not set a
default border color either), so always pair `border` with an explicit color such as
`border-border`.

## Plain CSS is a last resort, and it lives in index.css

Some styling has no utility form: `attr()`, `min()`, mixed fixed/`fr` grid templates,
pseudo-element triangles, per-property transition delays, an SVG `stroke-dashoffset` transition,
bespoke gradients, custom keyframes. Those are plain classes at the bottom of `index.css`, each
carrying a comment explaining why it isn't Tailwind — `.app-background`, `.modal-inner-grid`,
`.choice-grid`, `.menu-item-grid`, `.save-button`, `.reminder-tooltip`, `.break-card`,
`.ring-progress`, `.skeleton-shimmer`, `.exam-dropdown-*`, `.attempt-tr`/`.attempt-td`,
`.custom-checkbox::after`. Follow the pattern: confirm no utility exists, add the class beside its
peers, say why in a comment.

For repeated Tailwind markup, reuse the feature-scoped modules instead of a new plain class:
`src/components/SharedStyles.tsx` (auth/page primitives — `PageWrapper`, `Card`, `FormInput`,
`SubmitButton`, `WarningBanner` …, all `className`-mergeable), `AttemptHistoryStyles.tsx`,
`BreakModalsStyles.ts` (exported class-name constants).

Build every component mobile-first and responsive. `--breakpoint-*` is never overridden, so the
default breakpoints apply; `480px` has no named breakpoint and uses `min-[480px]:`.

## Related skills

- **Component structure, where a file goes, provider/export rules → invoke `frontend-guide`.**
- **A supervisor-only page or anything whose visibility depends on role → invoke `auth-rbac-guide`.**
