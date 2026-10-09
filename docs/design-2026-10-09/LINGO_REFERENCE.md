# Lingo 2027 reference adaptation

Source: `C:/Users/hayta_o4yzgf5/Downloads/Lingo – language app, 2027 design.html`.
This file is the current visual authority, superseding the earlier Taalbad HTML
and conversation screenshot for presentation. No source scripts were executed or
imported. Static SVG strings were extracted for city, coffee, landscape, shop,
and character illustrations in `src/design/lingoArtwork.ts`.

## Reference decisions

| Source detail | LearnByRP implementation |
|---|---|
| Warm paper, deep teal, coral, lime, lilac, pastel tiles | Existing canonical tokens and generated CSS/Tailwind maps updated; text/boundary shades adjusted to pass contrast |
| Bricolage Grotesque / Figtree | AppText throughout the UI, source Google Fonts link through Expo Router Head; web/network and native system fallbacks remain explicit |
| City with floating daily-goal card | Exact decorative city vector; floating actual due-phrase count instead of invented minutes/goal progress |
| Current lesson with lime CTA and coffee image | Real authored Dutch café mission, its band/minutes, reference coffee vector, existing briefing route |
| Four quick practice entries | Functional phrase review, mission catalog, speaking, progress; no placeholder grammar/listening drills |
| Explore Topics | Existing catalog route |
| Compact scene strip / speech bubbles | Authored mission and character; chronological durable learner/actor turns; earlier turns can be revealed |
| Coach dock, reply examples, microphone | Opt-in support disclosure with durable exposure writes, draft insertion without auto-send, existing speech adapter, coral circular microphone, typed/help/stop controls |
| Statistics cards / skills | Active-language durable receipts, final learner turns, archive phrases, existing grounded skill projections; no demo streaks, CEFR percentage, or invented achievements |
| Floating glass navigation | Existing Talk / Missions / Progress, source pill shape and teal selection; web blur with readable native fallback and reserved layout space |
| Tiny source labels / 44px controls | App readability floor remains 12px and touch targets remain at least 48px |
| Source phone frames / islands / status bars | Actual platform shell owns them; they are not copied into the app content |
| Motion / scrolling | Subtle spring press feedback, reduced-motion CSS/router behavior, operable shared scrollbars, bounded speaking dock at short heights |

## Coverage

Home, Missions, Progress, briefing, program, conversation, recap, settings, privacy,
onboarding, phrase detail, recovery, review dialogs, and coach sheets all consume
the shared typography and token system. Native retains those colors, geometry,
and controls, but custom native fonts and physical-device behavior are unverified.

Earlier generated PNGs remain in the source tree as prior work; this design
renders the new source vectors. Scene visual inventory points to the current
vector module; existing qualified human-review records remain empty.

## Verification

Final run: 885 unit tests passed, 3 skipped; 52 Playwright tests passed;
typecheck, deterministic scene validation, and web export passed. DESIGN.md
lint reports zero errors and warnings. All 36 core visual baselines were
deliberately refreshed for the new reference.

- Type checking, unit tests, deterministic scene validation, and web export run.
- Six core routes have 36 refreshed screenshots across 390/840/1440 and both themes.
- Interaction tests cover actual route transitions, EN/FR/NL at 320px, reduced
  motion, search clearing, suggestion persistence, draft insertion, mocked actor
  success, failed provider recovery, speech-adapter locale/gender, stopping,
  persistence, reload, and large-text/short-height rescue.
- Additional route tests cover onboarding to the under-review program, mission
  navigation, settings, privacy, phrase detail, recovery, and the font-link/style
  declarations. They preserve the existing review gate instead of expecting a
  nonexistent released-program launch button.
- `lingo-audit.json` retains the strict scanner's 58 React Native Button/onPress
  false positives. As described in AUDIT_NOTES.md, the scanner is not reported
  as passing and real interactions are verified separately.
- DESIGN.md lint and token/contrast synchronization checks pass.

Font-package downloads failed due to registry DNS resolution. Browser resource
inspection observed the source stylesheet and a Figtree font URL; bundling the
font failed, so offline native font files were not fabricated. Fonts can fall
back without blocking app boot. Web CSS declares the exact source families.

This work does not certify native font parity, physical-device acceptance, live
provider pronunciation/voice quality, human content review, or hosted deployment.
