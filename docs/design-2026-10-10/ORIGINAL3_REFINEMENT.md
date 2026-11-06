# Original 3 refinement prototype — 10 October 2026

The user selected Original 3 as Lingo's visual foundation, then asked to take the
next step. This artifact makes that refinement concrete across Home, Speaking,
Recap and Progress. It is a design study, not a shipped app or a second learning
engine. The remaining 138 Studio screens have not been redesigned here.

The user subsequently requested application across all 142 Studio screens. That
completed Studio adaptation is a separate artifact documented in
[STUDIO_REFINEMENT.md](./STUDIO_REFINEMENT.md); this file remains the original
four-screen benchmark study.

Open [the standalone HTML](./lingo-original3-refined.html), or run
`npm run prototype:lingo` and open http://127.0.0.1:4375.

## Reference lock

Primary reference: the Original 3 gallery in the supplied
`C:/Users/hayta_o4yzgf5/Downloads/Lingo Atelier 2027 — Premium Language Learning Experience.html`.
Preserve its illustrated city/current lesson, colorful quick activities, warm
canvas, prominent circular microphone, tonal dialogue, landscape, statistic chips
and distinct screen purposes. Atelier contributes component consistency and the
candidate Fraunces/DM Sans pairing. This is one selected direction, not another
set of unrelated designs.

`src/design/tokens.ts` remains the production color authority. The HTML embeds a
static snapshot of LIGHT/DARK for portability. Static vectors are reused from
`src/design/lingoArtwork.ts`; no downloaded reference scripts were imported or
executed. The scenery is decorative, not a claim about a particular Belgian city.
Live Refero research returned `NO_SUBSCRIPTION`; the user reference, current
project owners and bundled typography guidance ground this study.

| Decision | Result |
| --- | --- |
| Visual character | Keep Original 3's warm illustrations, expressive colors and speaking focus |
| Typography | Default Fraunces/DM Sans; an inspector switch compares the current Bricolage Grotesque/Figtree pairing |
| Color roles | Existing teal actions, coral speaking control, sage/teal word activity, amber listening activity, lavender patterns, lime scene CTA |
| Home hierarchy | One next conversation; review context and four compact activities |
| Speaking | Character/context above readable turns; microphone centered; typing, optional help and Finish remain available |
| Recap | Separate scene story and supported practice; next actions remain outside the content scroller |
| Progress | Activity chips and four visible practice areas at the default size; attributable example disclosure instead of arbitrary skill percentages |
| Dark theme | Existing forest canvas/surfaces with adapted semantic accents; a canvas scrim keeps text legible over scenery |
| Compact layout | Two activity columns below 350 px; 200% text wraps; inner content/dock scrolling at 560 px height |

## Inspector and interaction scope

- All four screens or one focused screen; left/right keys cycle views outside inputs.
- Daylight / Warm Midnight; serif / current rounded type.
- 320, 390 and 430 px preview widths; 560 and 800 px heights; 100% and 200% text.
- First use affects Home and Progress; connection loss affects Speaking; pending
  feedback affects Recap. These are illustrative states, not runtime/provider tests.
- Home → Speaking → Recap → Progress navigation.
- Help starts closed. Use as a draft fills the input without submitting. Send adds
  an in-memory learner turn and a clearly simulated actor reply.
- Recording and playback controls preview visual states only. They request no
  microphone access and produce no audio. Offline disables recording/sending and
  recovery preserves the in-memory draft.
- Inspector choices live in the URL. Learner drafts/turns are not saved and reset
  on reload. No application archive, consent record, account or assessment is read
  or changed.

The outer inspector explicitly identifies sample content/activity and simulated
audio. All learning examples, counts, statuses and A1 display labels are fixtures;
they confer no reviewed content status, assessed band or real learner evidence.
There is no pronunciation score, streak, proficiency percentage or CEFR promotion.

## Verification

Host-managed browser inspection confirmed:

- Both font pairings actually loaded; readable system fallbacks remain available.
- The complete four-screen navigation and explicit draft/send behavior work.
- Offline recording is disabled; the recovery action preserves a typed draft.
- Feedback pending shows the saved-scene message without an evidence card.
- First-use Progress has no activity statistics.
- No horizontal overflow in the checked product containers at 320/390/430 preview
  widths, with both 100% and 200% text and the 560 px height setting.
- At a 320 px browser viewport with 200% text, headings, activities, dock and
  practice cards wrap without horizontal overflow. Help/draft entry remains operable.
- At 1920 × 1200 with 390 × 800 previews, all four practice areas appear above
  Progress navigation. Both themes were visually inspected and captured.
- `npm run typecheck`, inline script syntax checking, the server script syntax
  check and `git diff --check` passed.

Saved captures: [Daylight](./lingo-v5-light.jpg) and
[Warm Midnight](./lingo-v5-dark.jpg).

This is not a complete accessibility audit, a working audio-session test, a web
export of the Expo app, native acceptance or provider verification. Core learning
and content contracts are unchanged; the core unit/content suites were not rerun
for this standalone visual study.

## Integration boundary

Production integration should use the existing AppText, canonical tokens,
ReferenceArtwork, shared primitives, Talk / Missions / Progress, archive projections
and session/support owners. The prototype's UI fixtures and scene scripting are
not executable learning content. The exact typography and component geometry
remain proposed until the rendered benchmarks are accepted. The production
DESIGN.md and existing delivery/reliability gates remain authoritative.
