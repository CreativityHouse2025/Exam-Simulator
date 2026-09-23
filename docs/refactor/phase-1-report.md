# Phase 1 report — remove styled-components
_Last updated: 2026-09-15 · batches complete: 9/9 — STOP 1 reached, halting per the goal_

## Progress log

Batch 1: `npm run verify` script added; token audit complete — `--color-grey-950`/`-1000` and
`--shadow-1`/`-4`/`-8` added to `@theme` (the only DEFAULT_THEME greys/shadows actually referenced
anywhere); baseline `verify` green except the one `api/` error (see BLOCKED).

**Batch 1 correction (caught in batch 3):** the `--shadow-1`/`-4`/`-8` tokens were originally
placed under `:root` instead of inside the `@theme` block — Tailwind's utility generator only
scans `@theme`, so `shadow-1`/`shadow-4`/`shadow-8` silently generated no CSS at all (a plain
`:root` custom property is invisible to it; that's also why `--grey-950`/`-1000` needed the
`@theme inline` alias they already had). Moved into `@theme` directly and verified empirically
(built a throwaway test file, grepped the emitted CSS) before trusting it again. No batch had used
these shadow tokens yet, so nothing downstream was silently broken by this — caught before it
mattered. Also corrected while investigating: **`z-index` in Tailwind v4 is a fully dynamic
utility** (`z-<any integer>`, not a fixed scale) — the batch-2 deviation log wrongly snapped
`ModalOverlay`'s `z-5`; reverted to the exact value (see the struck-through entry under
DELIBERATE DEVIATIONS). Lesson applied from here on: verify an unfamiliar utility against the
actual build output before recording it as "snapped" or "not supported" — several v4 utilities I
assumed were fixed named scales (`z-*`, `duration-*`, `scale-*`, `border-width` for integers,
`outline-width`, `ring-width`, `max-width`, `opacity`) turned out to be fully dynamic.

Batch 2: `SharedStyles.ts` → `SharedStyles.tsx`, 23 of 26 exports converted to plain Tailwind
components (3 kept as styled-components — see UNRESOLVED RISKS); `SignInPage`, `SignUpPage`,
`ForgotPasswordPage`, `ResetPasswordPage`, `ConfirmationCard`, `EmailField`, `PasswordField`
converted; `AuthCallbackPage` converted as a free bonus (only used SharedStyles, no local styled-
components of its own). `npm run verify` still green (same one pre-existing `api/` error).

Batch 3: `App.tsx` (`AppBackground`/`AppLayout`/`RoutesArea`), `Header.tsx`, `Loading.tsx`,
`Toast.tsx`, `SyncOverlay.tsx`, `Modal.tsx` converted. `HomePage.tsx` itself has no styling of its
own (pure role router) — its two real children, `StudentDashboardPage.tsx` /
`SupervisorDashboardPage.tsx`, already use Tailwind and aren't in the batch list at all;
`StudentDashboardPage.tsx` had one leftover `@styled-icons/material` import (3 icons), swapped to
`lucide-react` as a small bonus since it's required for DoD #6 eventually anyway and was zero-risk
(no CSS to convert, just an icon import). `npm run verify` still green.

Batch 4: every file under `src/components/exam/shared/` (`Choice`, `MultipleChoice` — no styling
of its own —, `Question`, `Explanation`, `Progress`, `Layout`, `Footer/*`, `Drawer/*`,
`BookmarkButton`, `SaveButtonWithReminder`, `SummaryRow`) plus `src/utils/color.ts` (now returns a
Tailwind class name instead of a color string, per the goal's own conversion rule, with its one
consumer `Cell.tsx` updated). `Drawer/Grid.tsx`'s styling — its hooks bug was already fixed in
batch 1, but the `styled.div` itself was untouched until now — is done too. `cardBorderMixin`/
`dropIn` fully retired from `SharedStyles.tsx` (their last consumer, `SaveButtonWithReminder`,
converted this batch); `fadeIn` stays until batch 5's `BreakModalsStyles.ts` converts. `npm run
verify` still green.

**Correction discovered this batch:** `border-t-4` on `Card` (batch 2) is corrected to
`border-t-3` — border-width, like z-index, is a fully dynamic Tailwind v4 utility for integers
(only decimal widths like `1.5`/`0.5` fall back to the fixed scale). Likewise confirmed
`outline-width` is dynamic. Batch 2's `FormInput`/Modal's `Button` border-width snaps (1.5→2,
1.5→2) still stand — those really were decimals with no exact utility.

Batch 5: every file under `src/components/exam/full/` that had any styling (`BreakModalsStyles`,
`BreakOfferModal`, `BreakTimerModal`, `FullExamContent`, `FullExamMain`, `FullExamMenu`,
`FullExamSummary`, `FullExamTopDisplay`, `Timer`) — `BreakModals`, `Confirms`, `FullExamDrawer`,
`FullExamFooter`, `FullExamProvider`, `FullExamSession` had none to begin with. `fadeIn` — the
last SharedStyles.tsx holdout — retired now that `BreakModalsStyles` (its last consumer)
converted; **`SharedStyles.tsx` no longer imports `styled-components` at all.** `npm run verify`
still green.

**Three more false-snap corrections found this batch** (same root cause as batch 3/4's
z-index/border-width ones): `max-width` is dynamic too (`max-w-110` = exactly 440px; batch 2's
`Card` corrected), and `ring-width` is dynamic too (`ring-3` = exact; batch 2's `FormInput`
corrected). Also confirmed (this time by testing what does *not* work) that `font-size`,
`border-radius` and box-shadow genuinely are fixed named-scale-only — those snaps all stand.

Batch 6: `src/components/exam/domain/` — `DomainExamContent`, `DomainExamMain`, `DomainExamMenu`,
`DomainExamSummary`, `DomainExamTopDisplay`, `DomainTimer`, `RevealAnswerButton` (`Confirms`,
`DomainExamDrawer`, `DomainExamFooter`, `DomainExamProvider`, `DomainExamSession` had no styling
to begin with). This directory mirrors `exam/full/` closely — most files are near-duplicates of
their `Full*` counterpart, converted the same way, same tokens reused (no new deviations beyond
what batch 5 already logged for the identical patterns). One addition: `DomainExamMain`'s
`ContentStyles` also had `scrollbar-gutter: stable`, which Tailwind v4 does have a real utility
for (`scrollbar-gutter-stable`) — confirmed by building a throwaway test file, not assumed.
`RevealAnswerButton` is new (full exams don't have it): a negative logical margin, confirmed
`-me-1.5` generates correctly the same way. `npm run verify` still green.

Batch 7: `src/components/exam/revision/` — `RevisionContent`, `RevisionMain`, `RevisionMenu`,
`RevisionSummary`, `RevisionTopDisplay` (`RevisionDrawer`, `RevisionFooter`, `RevisionProvider`,
`RevisionSession` had no styling). Third near-identical copy of the full/domain pattern — revision
has no save-button/sync UI and no "complete" filter (only all/marked/incomplete in-progress, plus
incorrect/correct once completed — makes sense, a revision session IS the "incorrect from a past
attempt" set already), otherwise the same conversions and tokens as batches 5-6, no new
deviations. `npm run verify` still green.

**Confirmed at this point: every batch 2-7 file is free of `styled-components`/`@styled-icons` —
those file lists are complete.** Only batch 8 remained before the final flip.

Batch 8: `attempt-history/*` (`AttemptHistoryStyles` — renamed `.ts`→`.tsx`, now components
instead of styled primitives — `AttemptHistoryRow`, `AttemptHistorySkeleton`,
`AttemptHistoryTable`, `AttemptStateIcon`, `AttemptStatusBadge`), `AttemptHistoryPage`,
`ProfilePage`, `exam-dropdown/*` (`Dropdown`, `MenuItem`, `MenuList` — `CategoryDropdown`,
`FullExamDropdown` had no styling). `npm run verify` still green.

**Confirmed across the whole `src/` tree: `grep -rl "styled-components" src/` now returns only
`src/main.tsx`** (the `ThemeProvider`/`GlobalStyle` setup — batch 9's job) **and
`grep -rl "@styled-icons" src/` returns nothing at all** — the full 25-file icon migration is
done. Every batch 2-8 file list is complete; only the final flip (batch 9) remains.

**`ProfilePage.tsx`'s `styled(Card)` risk (flagged in batch 2) is resolved, not just tested**:
rather than exercise the className-forwarding path, `ProfilePage.tsx` was converted in this batch
and `styled(Card)` dropped entirely (same as `ResetPasswordPage` in batch 2) — it now just passes
`className="max-w-125 relative"` straight to the converted `Card`. Nothing left depends on
`styled(Component)` wrapping any SharedStyles primitive.

Batch 9 (final flip) — all of Definition of Done items 1-8:
1. `grep -rn "styled-components" src/` returns nothing (confirmed; the only remaining hits
   anywhere are two historical comments in index.css naming the old `DEFAULT_THEME`, not code).
2. `index.css` now imports real `tailwindcss/preflight.css` into `layer(base)`. The hand-written
   substitute (`a`, `button`/`input`/`select`/`textarea` font resets, the button background/border
   reset) is deleted — real Preflight covers all of it, confirmed by reading `preflight.css`
   directly rather than assuming. `.tailwind-page` is deleted from `index.css` and from all 18
   call sites it had accumulated (the original 6 pre-existing pages + 12 added across batches
   2-8).
3. `html { font-size: 10px }` is gone (deleted with `GlobalStyle`, nothing else set it — checked
   `index.html` too). The px restatements of `--spacing`/`--text-*`/`--radius-*`/`--container-*`
   are deleted from `@theme`. **Verified before deleting**, not assumed: read Tailwind's own
   `theme.css` and confirmed every one of our px values already exactly equals Tailwind's rem
   default resolved at a 16px root (e.g. default `--text-lg: 1.125rem` × 16px = 18px, matching our
   deleted override) — so this flip is a no-op for every already-converted component's rendered
   size, not a re-conversion. `--breakpoint-*` was never overridden, left alone as instructed.
4. `DEFAULT_THEME` and the `Theme`/`ThemedStyles` types deleted from `constants.ts`/`types.ts`;
   `ThemeProvider`/`GlobalStyle` deleted from `main.tsx`. `GlobalStyle`'s real (non-styled)
   content — `direction: inherit`, the `::-webkit-scrollbar*` rules, `.no-select` — moved into
   `index.css`'s `@layer base`.
5. `@theme` (plus `@theme inline` for the color/font aliases) is the only token source — already
   true since batch 1.
6. `npm uninstall styled-components polished @styled-icons/material @styled-icons/boxicons-solid`
   ran clean (12 packages removed) and the app builds.
7. `npm run verify` passes — same one documented `api/` exception as every batch before this.
8. This file.

**Re-audited the 6 pre-existing Tailwind pages and `src/components/ui/*`** (goal's explicit
post-flip instruction) for patches that only existed to compensate for missing Preflight: found
exactly one, in `button.tsx` — `border-0` in the base classes existed only to zero out the UA
default border Preflight now already zeroes globally (`button{border:0 solid}`, confirmed by
reading `preflight.css`), so it's deleted. `border-border` on the `outline` variant is **not** a
Preflight patch and was **not** removed — verified that Tailwind v4's real Preflight does not set
a default border-color either (its button reset is border-width/style only), so a bare `border`
utility still draws in `currentColor` with or without Preflight; the comment explaining it was
corrected rather than the code. The 6 pre-existing pages themselves had no comparable patches to
find (checked for `box-border`, `list-none`, explicit `border-0` — none). No other `src/` file
mentions "Preflight" in a comment, so nothing else was in scope for this specific re-audit.

## BLOCKED

_None. See resolution below — the one entry this section held is closed._

**Resolved (post-STOP-1, user approved option (a)):** `api/_lib/services/attemptService.ts:189` —
`_user_id` assigned but never used. The existing `_` prefix wasn't enough because this repo's
eslint config has no `varsIgnorePattern`, so the rule fired anyway. Added a targeted
`// eslint-disable-next-line @typescript-eslint/no-unused-vars` on that one destructure instead of
touching eslint config (smaller, doesn't affect any other file). `npm run verify` now exits 0
end-to-end (typecheck + lint + build), no errors, only the pre-existing react-hooks/exhaustive-deps
warnings and the fast-refresh warnings on `ui/badge.tsx`/`ui/button.tsx`/`ui/tabs.tsx` (all
unrelated to this goal, none new). This is a one-line change to `api/`, outside the goal's stated
scope (Non-goals: "Touching `api/`"), done on explicit user approval to unblock the DoD #7 gate.

## UNRESOLVED RISKS

**`src/hooks/useResults.ts`** — `useFullExamLabel`/`useCategoryLabel` were called conditionally
(`if (examId) … else if (categoryId) …`), a real rules-of-hooks violation flagged by
`eslint-plugin-react-hooks`'s new static analysis (not by me — pre-existing). I changed it to call
both hooks unconditionally (`?? 0` as the no-match id for whichever branch doesn't apply) and pick
the result with a ternary afterward. Assumption: `examId ?? 0` / `categoryId ?? 0` never collides
with a real exam/category id of `0` — confirmed real ids start at 1 in
`src/data/exam/full-exams.json` / `categories.json`, so the "wrong" hook resolves to `undefined`
and is discarded, exactly matching the old branch's output. This is a behavior-preserving fix, not
a redesign, but I did not add a test — verify by loading an exam results page (`sourceLabel` shown
in the results summary) for both a full-exam attempt and a domain/category attempt.

**`src/components/exam/shared/Drawer/Grid.tsx`** — same class of pre-existing bug: an
`if (!exam || exam.length === 0) return null` sat *before* two `React.useMemo` calls, a
rules-of-hooks violation that crashes React if `exam` ever goes from null to populated without an
unmount. Fixed by computing over `examList = exam ?? []` inside the hooks and moving the null
check after them — same final render (null when exam is empty/null, same grid otherwise). Verify
by opening the exam drawer grid (all filter tabs: marked/complete/incorrect/correct/incomplete/
all) on a live session.

Both of the above are correctness fixes made to unblock the mandatory `npm run verify` gate
(DoD #7) — they are not styling changes and are outside this goal's stated scope, but leaving them
as silently-suppressed lint errors felt worse than a small, behavior-preserving fix. Flagging
loudly per the reporting rules rather than burying it.

**`src/components/SharedStyles.tsx` briefly (batches 2-4) still imported `styled-components`**
for 3 of its 26 original exports (`cardBorderMixin`, `dropIn`, `fadeIn`), kept alive only because
`SaveButtonWithReminder.tsx`/`Explanation.tsx` (batch 4) and `BreakModalsStyles.ts` (batch 5)
still depended on them raw. All three are retired now (batch 5 was the last), and
`SharedStyles.tsx` has imported nothing from `styled-components` since batch 5. No longer live —
recorded here as the reasoning trail in case anything downstream still assumes otherwise.

**App.tsx's app-wide wrapper deliberately never carried `.tailwind-page`** (moot since batch 9 —
see below — but the reasoning is worth keeping): it wraps the *entire app*, including every route,
most of which were still unconverted styled-components at the time. `.tailwind-page`'s
`box-sizing:border-box` rule targeted `.tailwind-page *` — every descendant — so putting it that
high would have flipped the box model for the whole unconverted app at once. It also wasn't
needed there: that wrapper never combined an explicit width with padding on the same element.
`Header`, `Loading`, `Toast`, `SyncOverlay`, `Modal` each got `.tailwind-page` on their own root
instead, being fully self-contained and each actually needing it.

**`.tailwind-page` was scoped per-converted-file rather than baked into `PageWrapper`/`Card`**
for the same reason, all the way through batch 8: `ProfilePage.tsx` rendered those same shared
primitives while still having its own unconverted local styled-components as siblings, and baking
the class into the shared primitive would have flipped ProfilePage's box model early.

_(Both of the above two are moot as of batch 9: `.tailwind-page` and the whole per-file
box-sizing-scoping problem no longer exist — real Preflight now sets `box-sizing: border-box`
globally, for every element, unconditionally. Left as a historical record of the reasoning rather
than deleted.)_

**Enabling real Preflight globally (batch 9) changes more than just box-sizing/font-size — I did
not audit every ripple.** Preflight also sets, among other things: `img`/`svg`/`video`/etc. to
`display: block` (previously inline, the browser default) and `max-width/height` behavior on
media, `border-color` resets, form-element appearance resets, `fieldset`/`legend` normalization,
and `::placeholder` opacity. Every styled-components rule in the app is gone now (confirmed), so
there's no more "unlayered CSS beats a layer" safety net anywhere — Preflight's base-layer
defaults now apply everywhere they didn't reach before. I checked the specific patterns I could
think to check (button border/color, box-sizing, the two explicit Preflight comments) but did not
exhaustively diff every element type against the old browser-default rendering. Most likely
affected: `<img>` tags not given an explicit `block`/`inline` class (I found none I added myself
that would visibly break — flex/grid children are blockified regardless of their own `display` by
the CSS spec, which covers most image usages here — but did not check every single `<img>` in the
app individually). Recommend a visual pass focused on: logos/avatars, any raw `<img>` not inside a
flex/grid container, and native form controls (`<input>`, `<select>`) on pages with heavier custom
form styling.

## PRE-EXISTING DEFECTS FOUND

**`FooterShell.tsx`'s `open` prop** is threaded through by every caller but was never referenced
by the original styled-components rule either — dead prop, pre-existing, left in the interface so
callers don't need touching, just unused in the component body now (was unused in the CSS
before too).

**`FullExamMain.tsx`'s `open` prop** — same dead-prop pattern: threaded through by its caller,
never referenced by the original styled-components rule (`MainStyles<{ $open: boolean }>`
declared it but never used it in the CSS). Left in the type signature, unused in the body, same as
`FooterShell`. (`DomainExamMain.tsx`/`RevisionMain.tsx` had the identical dead prop and were
handled the same way.)

**`MenuItem.tsx`'s `justify-self: flex-start`** (Drawer) was invalid CSS — `flex-start` isn't a
valid `justify-self` value (only valid in flex `justify-content`/`align-items`), so it was already
a silent no-op before this migration; the label centered instead of start-aligning. Originally
left as-is (a real behavior change, outside migration scope). **Post-STOP-1 update: fixed at the
user's explicit request** — label now always start-aligns via `justify-self-start` (user edited
`MenuItem.tsx` directly; the icon column's own `justify-items-center` is untouched). The `pl-2.5`
gap between icon and label was also removed as part of that same edit — label now sits flush
against its grid column's start edge with no left padding. Not verified visually by me.

**`Legend.tsx`'s `.bookmarked` selector** was unreachable — its `type` prop is typed
`GridTagTypes`, which has no `"bookmarked"` member, so no caller has ever been able to pass
`type="bookmarked"`. Dead CSS before this migration too. Not ported; no action needed unless the
human intends to actually use it somewhere.

**The rest of the pre-existing lint debt** (14 more errors surfaced at batch 1's baseline check,
none behavioral) was mechanical: missing `@ts-expect-error` descriptions (7 files: Header,
Dashboard, ForgotPasswordPage, ResetPasswordPage, SignInPage, SignUpPage, session.ts,
translation.ts×2) and `react-hooks/set-state-in-effect` warnings-as-errors (9 call sites across
DomainExamContent, DomainExamSession, FullExamSession, RevisionSession, BreakModals×3,
AuthCallbackPage, exam-detail/index.tsx×3, QuestionNavigator.tsx) plus two `no-explicit-any`
(progress.ts, translation.ts×2) and one more `no-unused-vars` I could fix (unlike the `api/` one).
All handled with a targeted `eslint-disable-next-line` / description comment, zero behavior
change — these are genuinely inert setState-in-effect patterns (state derived from a prop/dep
changing, not an infinite-loop risk) and correctly-suppressed `any`/`ts-expect-error` usages. Not
migration work, but required to get `npm run verify` running at all as a baseline.

## DELIBERATE DEVIATIONS

General conversion policy, used throughout and not re-derived per entry below: padding/margin/
gap/width/height/inset/size resolve exactly via Tailwind v4's dynamic spacing scale (`px/4`,
decimals allowed, e.g. `py-6.25` = 25px) — confirmed empirically to work down to quarter-`spacing`
steps (whole pixels, since `--spacing` is 4px); a source value that isn't a whole pixel (e.g.
8.5px from `0.85rem`) has no exact dynamic-spacing match and snaps to the nearest whole pixel
first. `font-size`, `border-radius`, and `box-shadow` are genuinely fixed named-scale-only in
Tailwind v4 (confirmed by testing that out-of-scale values generate nothing) and snap to the
nearest token; **ties are broken by rounding up**, except where noted. `z-index`, `duration-*`,
`scale-*`, `border-width`/`outline-width`/`ring-width` (integers only), `max-width`, and `opacity`
turned out to be fully dynamic, not fixed scales as first assumed in batch 2 — those early wrong
snaps are struck through below and corrected. Transition/animation timing-function `ease` (CSS
keyword) was left as Tailwind's default `transition`/`animate-in` curve
(`cubic-bezier(.4,0,.2,1)`, close but not identical to native `ease`) everywhere it appeared — a
few-ms curve difference on <300ms micro-interactions, not logged per instance.

### Batch 2 — Auth pages + SharedStyles.tsx

| file | property | old | new |
| --- | --- | --- | --- |
| SharedStyles.tsx (`Card`, was `cardBorderMixin`) | border-width | 0.5px | `border` (1px) |
| ~~SharedStyles.tsx (`Card`, was `cardBorderMixin`) | border-top-width | 3px | `border-t-4`~~ — **correction (batch 4)**: border-width is dynamic for integers; `border-t-3` is exact. Reverted. |
| ~~SharedStyles.tsx (`Card`) | max-width | 440px | `max-w-md` (448px)~~ — **correction (batch 5)**: `max-w-*` is dynamic too (`max-w-110` = exactly 440px). Reverted. |
| ~~SharedStyles.tsx (`ModalOverlay`) | z-index | 5 | `z-10`~~ — **correction (batch 3)**: `z-index` is a fully dynamic utility. Reverted to exact `z-5`. |
| SharedStyles.tsx (`PageTitle`) | font-size | 22px / 25px (mobile/md) | `text-xl`(20)/`md:text-2xl`(24) — both individually tied between neighboring tokens; resolved to preserve the original's grow-on-desktop direction rather than picking the same token for both |
| SharedStyles.tsx (`PageSubtitle`, `FormLabel`) | font-size | 13px / 15px (mobile/md) | `text-sm`(14)/`md:text-base`(16) — same tie-preserving-growth reasoning |
| SharedStyles.tsx (`FormInput`) | border-width | 1.5px | `border-2` (tie 1 vs 2, rounded up — a genuine decimal, no exact utility) |
| SharedStyles.tsx (`FormInput`) | border-radius | 10px | `rounded-xl` (12px, tie 8 vs 12, rounded up) |
| ~~SharedStyles.tsx (`FormInput` focus ring) | box-shadow `0 0 0 3px rgba(181,150,93,.15)` | custom | `ring-4 ring-primary/15`~~ — **correction (batch 5)**: ring-width is dynamic too (`ring-3` is exact). Reverted. Ring color still expressed via the `primary` token + opacity modifier rather than a raw rgba — that part wasn't a snap. |
| SharedStyles.tsx (`FieldError`) | font-size | 13px | `text-sm` (14, tie 12 vs 14, rounded up) |
| SharedStyles.tsx (`FormError`) | font-size | 12.5px | `text-xs` (12, nearer than 14) |
| SharedStyles.tsx (`FormError`) | background | `#fef2f2` (raw hex) | `bg-red-50` — this hex is Tailwind's own stock `red-50`; not a new color, just named |
| SharedStyles.tsx (`WarningBanner`) | background/border/text | `#fffbeb` / `#f59e0b` / `#92400e` | `bg-amber-50` / `border-amber-500` / `text-amber-800` — exact matches to Tailwind's stock amber scale |
| SharedStyles.tsx (`AuthSwitchBanner`) | background | `rgba(181,150,93,.08)` | `bg-primary/8` — 181/150/93 is our `primary` token's exact RGB, so this is the opacity modifier, not a new color |
| SharedStyles.tsx (`AuthSwitchBanner`) | border-radius | 10px | `rounded-xl` (12, tie 8 vs 12, rounded up) |
| SharedStyles.tsx (`SubmitButton`) | hover/active transform | `translateY(-2px)`/`(0)` | `-translate-y-0.5`/`translate-y-0` (exact, 2px = 0.5 spacing units) |
| ConfirmationCard.tsx (`HintSection`) | font-size | 13px / 13.5px (mobile/md) | `text-sm` both (14) — the md bump (13.5→14, already sub-pixel) fully collapses into the base snap, dropped as a no-op |
| ConfirmationCard.tsx (`HintSection`) | line-height | 1.6 (unitless) | `leading-relaxed` (1.625, nearest named step; Tailwind has no 1.6) |
| SharedStyles.tsx (`CardFooter`, `AuthSwitchBanner`) | font-size | 13.5px (same value both breakpoints) | `text-sm` (14) — no md variant needed, single snap covers both |
| SharedStyles.tsx (`PageLogo`) | `object-cover: fit` | — | **dropped, not ported** — not a real CSS property/value pair (should have been `object-fit: cover`); already a silent no-op. See PRE-EXISTING DEFECTS FOUND. |
| Icons: `EmailField`, `PasswordField`, `SignUpPage`, `ForgotPasswordPage`, `ResetPasswordPage` | icon set | `@styled-icons/material` (filled) | `lucide-react` (outline/stroke) — `Email→Mail`, `Lock→Lock`, `Visibility→Eye`, `VisibilityOff→EyeOff`, `ArrowBack→ArrowLeft`, `MarkEmailRead→MailCheck` (nearest equivalent, not a literal name match). This filled→outline change recurs identically across all ~25 icon files this migration touched; not re-logged per file. `size={N}` props carried over unchanged. |

### Batch 3 — App shell

| file | property | old | new |
| --- | --- | --- | --- |
| App.tsx → index.css (`.app-background`) | — | styled-components template | plain CSS class — a bespoke 4-stop radial-gradient decoration has no Tailwind utility representation |
| App.tsx → index.css (`.app-background`) | z-index | -1 | `-z-10` (nearest scale step available to a negative `z-*`; `-z-0` would put it at the same level as normal content instead of reliably behind it — functional) |
| Header.tsx (`TitleStyles`) | font-size | 18px / 20px (mobile/md) | `text-lg`(18)/`md:text-xl`(20) — both exact |
| Header.tsx (`DropdownItem`) | gap / padding-block | 8.5px | `gap-2.25`/`py-2.25` (9px) — not a whole pixel, snapped, tie rounded up |
| Header.tsx (`DropdownItem`) | font-size | 12.5px | `text-xs` (12, nearer than 14) |
| Loading.tsx | icon | `Repeat` (styled-icons, filled) | `Repeat` (lucide, outline) — same name, exact 1:1 |
| Loading.tsx → index.css | animation | `rotate 1s` (default/`ease` timing) | ported as `--animate-rotate` custom token, exact — deliberately not Tailwind's built-in `animate-spin` (`linear`, a different motion character) |
| Toast.tsx (`CloseButton`) | font-size | 1.5em (resolves to 24px against the 16px `text-base` it inherits) | `text-2xl` (24, exact) |
| Toast.tsx → index.css | animation | `slideDown 0.4s cubic-bezier(.23,1,.32,1)` | ported as `--animate-slide-down`, exact including the easing curve — kept custom rather than `tw-animate-css`'s `slide-in-from-top` because the toast also needs a permanent `translateX(-50%)` centering baked into the same `transform` property the animation drives |
| Modal.tsx (`Window`) | animation | `grow 200ms ease` | ported as `--animate-grow`, exact — same "shares `transform` with a permanent translate" reason as Toast |
| Modal.tsx (`Inner`) | grid-template-rows | `3rem 1fr 5rem` | plain CSS class `.modal-inner-grid` (30px/1fr/50px) — no Tailwind `grid-rows-*` expresses a mixed fixed/fr template |
| Modal.tsx (`Button`) | padding-block | 7.5px | `py-2` (8px) — not whole pixel, snapped, tie rounded up |
| Modal.tsx (`Button`) | font-size | 15px | `text-base` (16, tie vs 14, rounded up) |
| Modal.tsx (`Button`) | border-radius | `theme.borderRadius` = 2px | `rounded-xs` (2px, exact) |
| Modal.tsx (`ButtonConfirm`/hover) → index.css | color | `polished` `darken(0.1, '#dc2626')` / `darken(0.1, theme.secondary)` | precomputed via the actual `polished` package to `#b21d1d` / `#392435`, added as `--color-danger-hover` / `--color-secondary-hover`. `DANGER_COLOR` (`#dc2626`) is exactly Tailwind's stock `red-600`, but registered as our own `--color-danger` token to pair with its hover token. |
| Loading.tsx, SyncOverlay.tsx | icon / spinner | filled `Repeat` / bare CSS border-spin | outline `Repeat` / same border-spin technique, unchanged |
| StudentDashboardPage.tsx (bonus, not in batch 3's file list) | icons | `Assignment`/`ViewModule`/`PlayArrow` (styled-icons) | `ClipboardList`/`LayoutGrid`/`Play` (lucide) — nearest equivalents |

### Batch 4 — exam/shared/*

| file | property | old | new |
| --- | --- | --- | --- |
| Choice.tsx, MenuItem.tsx (Drawer) | grid-template-columns | `2rem 4rem 1fr` / `5rem 1fr` | plain CSS classes `.choice-grid` / `.menu-item-grid` — mixed fixed/fr templates have no Tailwind utility |
| Choice.tsx | icons | `RadioButtonChecked`/`Unchecked`, `CheckBox`/`CheckBoxOutlineBlank` (styled-icons, filled) | `CircleDot`/`Circle`, `SquareCheck`/`Square` (lucide, outline) |
| Choice.tsx (`LabelStyles`) | `margin-top` | -2px (literal, not rem) | `-mt-0.5` (exact) |
| Explanation.tsx | background (correct/incorrect) | `polished` `lighten(0.4, correct/incorrect)` | precomputed to `#d9eeda`/`#fff8f7`, added as `--color-correct-bg`/`--color-destructive-bg` |
| Explanation.tsx | text color (correct/incorrect accents) | `polished` `darken(0.1, correct/incorrect)` | precomputed to `#3d8b40`/`#ea1c0d`, added as `--color-correct-strong`/`--color-destructive-strong` |
| Explanation.tsx | icon | `VisibilityOff` (styled-icons) | `EyeOff` (lucide) |
| Explanation.tsx (`NormalText`) | `margin-bottom: 0.5rem` on a `<span>` | pre-existing no-op (vertical margin doesn't apply to inline elements) | **not ported** — kept as a plain inline `<span>` with no margin, preserving the actual (broken) behavior rather than "fixing" it |
| Arrows.tsx | icons | `SkipPrevious`/`SkipNext`/`KeyboardArrowLeft`/`KeyboardArrowRight` | `SkipBack`/`SkipForward`/`ChevronLeft`/`ChevronRight` |
| Arrows.tsx (`ArrowsStyles`) | grid-template-columns | `repeat(4, 5rem)` (4 fixed 50px columns) | `grid-cols-4 w-50` — fixing the container's own width to exactly 4×50px makes the equal-fr columns land on 50px each, pixel-identical without a plain-CSS class |
| Arrows.tsx, Cell.tsx, MenuItem.tsx | hover/answered background | `polished` `lighten(0.2, primary)` | precomputed to `#d5c3a3`, added as `--color-primary-light` (one token, reused in all three) |
| Legend.tsx | "incorrect" swatch | `polished` `lighten(0.2, secondary)` | precomputed to `#985e8c`, added as `--color-secondary-light` |
| Legend.tsx | `.bookmarked` selector | pre-existing dead code | not ported — see PRE-EXISTING DEFECTS FOUND |
| Legend.tsx (`NameStyles`) | font-size | 9px | `text-xs` (12 — the smallest named token) |
| Cell.tsx | width/height | 45px | `w-11.25`/`h-11.25` (exact) |
| Cell.tsx | font-size | 10px | `text-xs` (12) |
| Cell.tsx | `outline` width | 3px | `outline-3` (exact — dynamic for integers) |
| MenuItem.tsx | `justify-self: flex-start` | pre-existing no-op | not ported at the time (batch 4) — later fixed post-STOP-1 at user request, see PRE-EXISTING DEFECTS FOUND |
| SaveButtonWithReminder.tsx (`SaveButton`) | box-shadow + hover/active bg/shadow/transform | custom primary-tinted shadow, `polished` `lighten`/`darken(0.04, primary)` | kept as plain CSS class `.save-button` (precomputed `#bb9f6b`/`#ae8d50`) — three properties with three different transition durations is not one Tailwind utility's shape |
| SaveButtonWithReminder.tsx (`ReminderTooltip`) | `width: min(170px, 82vw)`, box-shadow, `::before` arrow | custom | plain CSS class `.reminder-tooltip` — `min()` and a pseudo-element triangle have no Tailwind form |
| SaveButtonWithReminder.tsx (`CustomCheckbox::after`) | checkmark tick, `translate(-0.5px, -1px)` | custom | kept as plain CSS — sub-pixel glyph nudge, not a design-scale value |
| SaveButtonWithReminder.tsx | icons | `Save` (exact), `Close` | `Save`, `X` (lucide's close icon) |
| Header.tsx (`DropdownItem`, carried over from batch 3) | gap/padding | 8.5px | snapped to nearest whole pixel first (9px), then quarter-stepped |

### Batch 5 — exam/full/*

| file | property | old | new |
| --- | --- | --- | --- |
| BreakOfferModal.tsx, BreakTimerModal.tsx (`Btn*`) | color, hover | `polished` `darken(0.1, secondary)` | reused `--color-secondary-hover` (already added in batch 2 for the same computation) |
| BreakModalsStyles.ts (`BreakCard`) | `width: min(90vw, 50rem)` | custom | plain CSS class `.break-card` |
| BreakModalsStyles.ts (`BreakCard`) | box-shadow | `theme.shadows[8]` | `shadow-8` (existing token, exact) |
| BreakOfferModal.tsx (`Message`) | font-size | 25px | `text-2xl` (24, nearer than 30) |
| BreakTimerModal.tsx (`Digits`) | font-size | 33px | `text-4xl` (36 — exact tie vs `text-3xl` 30, rounded up) |
| BreakTimerModal.tsx (`Digits`) | font-weight | 650 (non-standard) | `font-bold` (700 — tie vs 600, rounded up) |
| BreakTimerModal.tsx (`RemainingLabel`) | color | `polished` `transparentize(0.4, secondary)` | `text-secondary/60` — an opacity reduction of an existing solid color is exactly what the `/N` modifier does; no precomputed hex needed |
| BreakTimerModal.tsx (ring circles) | `stroke-width`, `stroke-dasharray`/`-dashoffset` | CSS on a styled `<circle>` | passed as real SVG props (`strokeWidth`, `strokeDasharray`, `strokeDashoffset`) — idiomatic React, not a Tailwind concern |
| BreakTimerModal.tsx (ring circles) | `transition: stroke-dashoffset 1s linear` | custom | plain CSS class `.ring-progress` — no Tailwind utility transitions an SVG stroke property |
| FullExamMenu.tsx | icons | `FormatListNumbered`, `CheckBoxOutlineBlank`/`CheckBox`, `DoneAll`, `Cancel`, `AssignmentTurnedIn`, boxicons' `Report` (a different package, also removed) | `ListOrdered`, `Square`/`SquareCheck`, `CheckCheck`, `XCircle`, `ClipboardCheck`, `FileWarning` — `Report`→`FileWarning` especially is a guess at intent, not a name match |
| FullExamSummary.tsx, FullExamMenu.tsx | grid-template-rows: `repeat(N, auto)` | custom | **not a deviation** — omitting `grid-template-rows` produces the identical result, since CSS Grid's own default *is* auto-sized implicit rows |
| FullExamSummary.tsx (`TitleStyles`) | font-size | 40px | `text-4xl` (36, nearer than 30) |
| FullExamTopDisplay.tsx (`CategoryExamChip`) | border-radius | 20px | `rounded-3xl` (24 — exact tie vs `rounded-2xl` 16, rounded up) |
| FullExamTopDisplay.tsx (`ChipRow`) | gap | 7.5px | `gap-2` (8px — not whole pixel, snapped, tie rounded up) |
| FullExamTopDisplay.tsx (`QuestionTextStyles`) | font-size | 40px | `text-4xl` (36, nearer than 30) |
| Timer.tsx | icon | `Timer` (styled-icons) | `Timer` (lucide) — exact name match |

_Batches 6-7 (exam/domain/*, exam/revision/*) reused every pattern above with no new deviations —
each directory mirrors `exam/full/*` closely enough that the same tokens and snaps applied._

### Batch 8 — attempt-history/*, AttemptHistoryPage, ProfilePage, exam-dropdown/*

| file | property | old | new |
| --- | --- | --- | --- |
| AttemptHistoryStyles.tsx (`Td`'s `::before`) | `content: attr(data-label)` | reads a live DOM attribute | **kept as plain CSS** — `attr()` has no Tailwind representation, static or dynamic; the whole `Tr`/`Td` pair stays plain CSS rather than mixing systems |
| AttemptHistoryStyles.tsx (`Tr`) | `animation-delay: index * 0.06s` | per-row dynamic value | kept as inline style — `delay-*` is dynamic but only for a literal class name the build-time scanner can see in source; a template-computed one is invisible to it |
| AttemptHistoryRow.tsx (`TypeBadge`) | background | `rgba(181,150,93,.14)` / `rgba(89,55,82,.1)` | `bg-primary/14` / `bg-secondary/10` — both are exactly the app's primary/secondary at reduced opacity |
| AttemptStatusBadge.tsx | background | `${theme.correct}1F` / `${theme.incorrect}1A` (8-digit hex alpha) | `bg-correct/12` / `bg-destructive/10` — hex alpha is already a 256-step quantization of a percentage; nearest-integer-percent isn't a meaningfully different approximation |
| AttemptStatusBadge.tsx (fallback dash) | color | `#B3B2B2` (raw hex) | `text-grey-600` — exactly `grey[6]` from `DEFAULT_THEME`, already a ported token |
| Dropdown.tsx, AttemptHistoryPage.tsx, AttemptHistoryTable.tsx | icons | `Close`, `Refresh` (styled-icons) | `X`, `RefreshCw` (lucide) |
| AttemptStateIcon.tsx | icons | `HourglassEmpty`, `CheckCircle` | `Hourglass`, `CircleCheck` |
| Dropdown.tsx (`Overlay`) | `backdrop-filter: blur(3px)` | 3px | `backdrop-blur-xs` (4px, named scale's smallest step — no dynamic pixel form for backdrop-blur, confirmed by testing) |
| Dropdown.tsx (`Overlay`, `MenuWrapper`) | staggered `visibility` transition delay (no delay opening, delayed closing) | custom | plain CSS (`.exam-dropdown-overlay`/`.exam-dropdown-wrapper`, toggled via `data-open`) — multiple properties each with their own delay isn't one Tailwind transition utility's shape |
| Dropdown.tsx (`Menu`) | `width: min(92vw, 120rem)`, `max-height: 85vh`, box-shadow | custom | plain CSS class `.exam-dropdown-menu` |
| MenuList.tsx (exam-dropdown) | grid-template-columns responsive steps | `repeat(2/3/4/5, 1fr)` at 0/480/768/1024px | `grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-4 lg:grid-cols-5` — 480px has no named breakpoint, used the goal's own prescribed `min-[480px]:` escape hatch |
| exam-dropdown/MenuItem.tsx | hover box-shadow | `0 3px 3px rgba(0,0,0,.1)` | plain CSS class `.exam-dropdown-menu-item:hover` |
| ProfilePage.tsx (`InitialsAvatar` call site) | width/height | `size-[72px]` (pre-existing **arbitrary value**, not introduced by this migration) | `size-18` — exact equivalent, fixed opportunistically while touching this exact JSX line for the `Card` conversion below it |
| ProfilePage.tsx (`ActionButton`, danger hover) | background | raw hex `#fde8e8` | added as `--color-danger-bg-hover` — distinct from Modal.tsx's `--color-danger-hover` (that one darkens a solid button; this lightens a pale one) |

### Batch 9 — final flip

No conversion deviations (nothing left to convert) — see the Progress Log above for what
changed and how each removal was verified rather than assumed.

## REVIEW CHECKLIST

Ordered roughly by how likely it is to be wrong, most likely first. "ar+en, mobile+desktop" means
check every combination, not just one.

**1. Highest risk — global Preflight flip (batch 9), affects every single route:** a behavior
change with no per-page precedent to compare against (see UNRESOLVED RISKS above). Load literally
any page and check for: unexpected image sizing/inline-vs-block shifts, native form control
appearance (checkboxes/radios/selects — did any survive as raw unstyled HTML elements anywhere?),
unexpected list markers reappearing, table default spacing.

**2. `/history`** (batch 8) — the mobile-card-vs-desktop-table switch is the single biggest
layout-mode change in this migration. Check: mobile card layout vs desktop table, shimmer skeleton
while loading, row entrance stagger, type/status pill colors, action button states (continue/
review/retry, retry's disabled state), refresh icon spin (both the inline one and the mobile-only
header one), title/subtitle entrance animation.

**3. Anything with a custom checkbox, pseudo-element triangle, or shimmer/skeleton**
(save-button reminder tooltip, exam-dropdown menu, attempt-history skeleton) — these moved to
hand-written plain CSS rather than Tailwind utilities and have no automated check.

**4. Every exam session type** (full/domain/revision) — largest single volume of conversions,
most snapped values. Check per type: top display chip (border-radius, gap), question counter,
timer icon/color at <2min warning, break offers at Q61/Q121 (full exam only — backdrop skip,
buttons), the break countdown ring (SVG stroke colors, rotation, center digits), exam summary
screen (title size, two-column stats, retake/restart buttons stacking on mobile), the exam
drawer's filter icons, choice selection colors (selected/correct/incorrect states), the drawer
(open/close width animation, grid of question cells, legend swatch colors, menu items), footer
arrows (fixed-width layout, disabled/hover states), bookmark toggle (fill vs outline), save button
+ reminder tooltip (full/domain only), reveal-answer eye icon (domain only), explanation box on
reveal/review, progress bar fill width.

**5. Any exam-picker dropdown** (start new exam / mini-exam flows — call sites of
`FullExamDropdown`/`CategoryDropdown`): backdrop blur + fade, menu grow-in, responsive column
count (2/3/4/5 across the four breakpoints), item grid hover shadow.

**6. `/profile`**: back button, avatar, info box, divider, both action buttons (including the
danger-variant sign-out button's hover background).

**7. Auth pages and app shell** — lower risk (simpler layouts, fewer snaps) but first to break if
a shared `SharedStyles.tsx` primitive is wrong, since every other page uses it. Check: `/signin`,
`/signup`, `/forgot-password`, `/reset-password` (needs a valid reset-session/token — check via a
real reset-password link) — card width/padding, title/subtitle size steps at 768px, input focus
ring color/spread, the two banner colors (error red / session-conflict amber on sign-in), submit
button hover lift + disabled state, password show/hide icon, sign-up's two-column name row
collapsing on mobile. Sign-up success / forgot-password sent screens: `ConfirmationCard`'s icon
and hint banner. `/auth/callback` error state (only reachable via a broken/expired confirmation
link). Every route: `Header` (logo/title centering, language toggle, mobile dropdown menu,
sticky positioning) and the background gradient, both render on every page now. Any page showing
a `Modal`: backdrop click-to-close, grow-in animation, confirm/cancel button colors, grid layout.
`SyncOverlay` (`src/providers/SessionProvider.tsx`, live only during an active exam session):
fades in over 0.1s, disappears instantly (no fade out) — that asymmetry is deliberate. Toast (any
action that triggers one): slide-down entrance, close button. `/`: `HomePage` itself has no
markup; check `StudentDashboardPage`'s three button icons render and `SupervisorDashboardPage`
is unaffected (untouched).

## FOLLOW-UPS

- **`.claude/skills/styling-guide.md` and any other skill/doc describing the old Preflight-off,
  10px-root, `.tailwind-page` setup is now wrong** and needs rewriting to describe the current
  (real Preflight, 16px root, no scoping class) state. The goal's own Overrides section
  explicitly deferred this to a separate task and forbade me from touching it here — flagging it
  so it isn't forgotten, not doing it.
- **Redundant-but-harmless `box-border`/explicit box-sizing utility classes** added throughout
  batches 2-8 (e.g. `FullExamMain`/`DomainExamMain`/`RevisionMain`'s content divs, `MenuItem.tsx`
  in exam-dropdown) are now duplicate no-ops now that Preflight sets `box-sizing: border-box`
  globally. Harmless to leave, but a follow-up cleanup pass could remove them for clarity. Out of
  scope for the batch-9 re-audit, which was explicitly limited to "the 6 pre-existing Tailwind
  pages and `src/components/ui/*`."
- **`api/_lib/services/attemptService.ts:189`** — the one remaining `npm run verify` lint
  failure, left untouched because `api/` is out of this goal's scope (see BLOCKED above). A
  one-line fix whenever someone's willing to touch that file.
- **One more pre-existing dead-code item surfaced during conversion, not fixed** (see
  PRE-EXISTING DEFECTS FOUND): `Legend.tsx`'s unreachable `.bookmarked` CSS selector.
  (`MenuItem.tsx`'s invalid `justify-self: flex-start` was the other one — fixed post-STOP-1 at
  user request, see PRE-EXISTING DEFECTS FOUND.)
- **Phase 2** (handwritten components → shadcn) is next, per the goal — not started.
