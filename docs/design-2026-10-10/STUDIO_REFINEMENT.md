# Lingo UX Experience Studio V5 — all 142 screens

Date: 10 October 2026. The user requested application of the selected Original 3
refinement across the complete Studio. The result is
[lingo-ux-studio-v5.html](./lingo-ux-studio-v5.html), a portable standalone HTML
prototype with all 142 original routes and their existing screen families.

Run `npm run studio:lingo` and open http://127.0.0.1:4376. Rebuild the artifact
with `npm run build:lingo-studio` after changing the refinement source.

## Design applied

- Original 3's warm canvas, illustrated scenes, activity colors, circular speaking
  control, pastel quick activities, statistic chips and floating navigation.
- The selected Fraunces / DM Sans pairing, refined card geometry, consistent
  spacing, readable control boundaries and canonical light/forest colors.
- The four benchmark layouts integrated into the original Studio controller:
  Home, live speaking, scene recap and Progress. Home spacing is tightened so its
  quick activities and exploration card fit more comfortably in the default view.
- A shared component layer for headings, rows, cards, choices, switches, fields,
  action groups, calendars, exercise inputs, audio controls and reading layouts.
- Authored route/category mapping for color roles, without positional/random
  activity colors. Speaking uses coral, listening amber, words teal/sage and
  patterns lavender. Primary actions use deep teal; the learning CTA uses lime.
- Family-specific treatments: onboarding selections, exercise controls, word
  cards, immersion/media rows, reading surfaces, account controls, plan selection
  and recovery states retain their distinct task structure.
- Talk / Missions / Progress navigation and all 142 sidebar entries. Screen board,
  group filters, search, keyboard activation and the Original 3 static comparison
  remain available.
- Daylight / Warm Midnight, serif / current rounded typography, 320/390/430 px
  preview widths, 560/800 px heights and 100%/200% text controls.

| Existing family | Screens |
| --- | ---: |
| Getting started | 22 |
| Home & study plan | 15 |
| Guided lessons | 18 |
| Real-life scenarios | 14 |
| Training & review | 17 |
| Immersion library | 18 |
| Progress & profile | 21 |
| Lingo Plus | 9 |
| States & recovery | 8 |
| **Total** | **142** |

## Ownership and boundaries

The existing Studio controller continues to own navigation, exercise choices and
in-memory messages. The refinement adds rendering hooks and shared presentation;
it does not introduce a learning engine. Its source is in
`scripts/lingo-studio/refinement.css` and `refinement.js`. The builder keeps a
frozen, byte-identical copy of the supplied HTML in `atelier-source.html`, checks
its controller seams and emits one standalone file. `STUDIO_BUILD.json` records
the source SHA-256 and output metadata. The original Downloads file is untouched.

Colors come from `src/design/tokens.ts`; static artwork comes from
`src/design/lingoArtwork.ts`. They are embedded snapshots for this portable
prototype. The production token/typography and session/evidence owners remain
authoritative for later Expo integration.

The Studio retains the source's French demonstration content. This is a visual
application, not a reviewed Dutch curriculum translation or a new assessed-band
release. Accounts, prices, purchases, activity counts, lesson feedback and
learning examples remain explicitly labeled fixtures.

The stacked experimental scripts/styles were removed from the generated Studio.
Recording/playback controls simulate visual states and request no microphone
access or speech synthesis. Recognition confidence is never used as a
pronunciation score. Suggested replies are opt-in; drafting does not submit.
Accessibility switches operate independently in the preview. A selected
appearance is applied directly, and malformed route hashes fall back safely.
None of these prototype interactions writes application learning history,
consent, accounts, purchases or assessment evidence.

## Verification

`STUDIO_AUDIT.json` contains actual host-managed browser measurements:

- Every one of the 142 routes was opened and its rendered route, family, nonempty
  content and principal horizontal-overflow surfaces inspected in four conditions:
  light/320/100%, light/320/200%, dark/430/100%, dark/430/200%.
  **568 route checks, no failures in the checked surfaces.**
- Eleven representative screens, covering all nine families plus recap/settings,
  were inspected and captured in both themes at 390 px: **22 additional checks**.
- The 142-card screen board rendered with 142 inert previews and no missing
  checked SVG gradient/filter references. Keyboard opening works. Search for
  podcasts returns the correct route; clearing search restores all 142 entries.
- Missing exercise selections and empty cloze inputs do not advance. A wrong
  choice shows corrective feedback; a filled cloze advances to its feedback.
- Speaking help starts closed; using the example fills/focuses the draft without
  adding a turn. Explicit send adds the learner and simulated actor turns.
  Recording preview starts/stops, recap actions stay outside the scroller and
  Progress links to four practice areas.
- Accessibility settings can be toggled independently. Enlarged text and reduced
  motion update their preview controls; selected dark appearance applies correctly.
- At a 320 px browser viewport and a short 560 px preview with 200% text, the
  mobile catalogue opens, speaking help/draft entry remains operable, and no
  horizontal overflow was found in the checked shell/dock/input surfaces.
- No page JavaScript errors were returned during the representative checks.
- Build, inline JavaScript parsing, script syntax checks, `npm run typecheck` and
  `git diff --check` passed.

Early pointer-driven catalogue automation returned input-response timeouts after
some transitions had already completed. The final recorded sweeps use keyboard
activation and verify each resulting DOM state; those checks completed.

This is not a full accessibility audit or proof of every interaction, native
behavior, live audio/provider operation, payment integration or production
deployment. No Expo route, learning contract or authored scene content changed;
the core unit/content and Expo export suites were not rerun for this standalone
Studio artifact.

## Captures

The folder contains Daylight and Warm Midnight screenshots for each representative
family. Start with [Home](./studio-home-light.jpg),
[Speaking](./studio-speak-light.jpg), [Progress](./studio-profile-light.jpg),
[dark listening exercise](./studio-learn-dark.jpg),
[screen board](./studio-board-light.jpg) and
[compact speaking help](./studio-compact-help.jpg).

The separate [four-screen study](./lingo-original3-refined.html) remains available
as the earlier benchmark. Applying the Studio to the native app should reuse the
canonical UI owners and preserve the existing truth/reliability gates.

## Color bar

The Studio now has an always-visible color bar below its header. Choose Warm or
Warm Midnight, then a cream, sage, rose, lavender or sand palette. Each palette
has a light and dark counterpart. Warm cream restores the canonical theme.
The choice applies to the Studio shell, every route and the screen board, and is
kept in the URL across navigation and reload. The selection coordinates the canvas,
cards, secondary surfaces, fields, borders, text, primary buttons and navigation.
Semantic feedback and activity accents retain their meaning. Production tokens
are unchanged; the palette overrides belong only to this standalone prototype.

All ten theme/background combinations were exercised in the browser with one
selected theme and one selected background, the expected rendered canvas and no
page overflow. Progress navigation and reload retained the selection. The existing
header theme switch synchronized with the bar. At an actual 320 px browser width,
all seven controls remained visible with 44 px minimum height and no horizontal
overflow. No page JavaScript errors were returned. Build, inline parsing, adapter
syntax and diff checks passed. See [color bar](./studio-color-bar.jpg).

The initial bar changed only the canvas, leaving teal cards and buttons on a
lavender background. Coordinated palettes now resolve all shared neutral/action
tokens, and a CSS bridge removes retained fixed teal dark-mode chrome. All ten
combinations were checked on `study-time`: card, primary-button and progress-badge
text contrast exceeded 4.5:1. Every one of the 142 routes rendered nonempty on
dark lavender with the correct canvas and no page overflow. Selected options,
header controls and the badge also used lavender tones; 320 px layout and page
JavaScript error checks passed. This is a targeted contrast check, not a full
accessibility audit. See [palette audit](./STUDIO_PALETTE_AUDIT.json) and
[corrected lavender screen](./studio-lavender-aligned.jpg).
