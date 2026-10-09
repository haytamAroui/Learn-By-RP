# Reference-design audit notes

The raw strict scanner output is preserved in `premium-audit.json`.
All 58 findings are `affordance.actionless-button` on shared React Native
`<Button onPress={...}>` consumers. The scanner lowercases the component tag to
`button` but only recognizes HTML `onClick`, Vue `@click`, and submit behavior
(`audit_project.py` lines 720–740). It does not recognize this app's `onPress`
contract. These are framework false positives; handlers remain in the shared
Button/Pressable implementation and project E2E verifies actual actions.

The scanner is not reported as passing. No controls are renamed or hidden to
silence it. Project tests, token/contrast gates, web export, and interaction/visual
E2E remain the verification authority for the changed surfaces. Native/provider
audio and physical-device behavior require separate verification.

Final project verification:

- `npm run typecheck`: passed.
- `npm test -- --reporter=dot`: 878 passed, 3 skipped.
- `npm run build:web`: passed; preview served on `127.0.0.1:8081`.
- `designmd lint DESIGN.md`: 0 errors and 0 warnings.
- Playwright visual/interaction and small-screen recovery run: 42 passed.
  The 36 expected screenshots were deliberately refreshed for the new approved
  visual direction, across 390/840/1440 widths and light/dark themes.
- New browser checks exercised the real home actions, keyboard start, Dutch-only
  phrase queue, search clearing/focus, all three UI locales at 320px, and reduced
  motion. The existing 320px large-text test exercised a typed session through
  help, failed provider response, stopping, persistence, reload, and recovery.
- Source CSS/HTML was inspected directly; local-file browser rendering of the
  reference was blocked by the browser URL policy. Implemented app screenshots
  were reviewed against the extracted layout, palette, artwork, and component
  rules. The final dark navigation seam and clipped input label were corrected.

This is web/runtime UI verification with mocked failure paths. It does not verify
live provider audio, physical-device behavior, or content-review release gates.

## Conversation screenshot extension

The later screenshot adaptation is documented in `SESSION_REFERENCE.md`.
Final results: typecheck and web export passed; 883 unit tests passed, 3 skipped;
10 interaction/recovery checks and 6 refreshed live-route visual checks passed.
Scene validation still passes deterministic structure gates; human review remains
separate. DESIGN.md lint has zero errors and warnings. The new strict audit report
`conversation-audit.json` retains the same 58 `Button onPress` scanner false positives.
Adapter tests assert female nl-BE speech requests using valid silent PCM fixtures;
they do not audition a live Gemini voice.

## Lingo 2027 app-wide adaptation

The current reference and mapping are documented in `LINGO_REFERENCE.md` and
`DESIGN.md`; they supersede the earlier visual treatments. Final results:
typecheck, scene structure validation, and web export passed; 885 unit tests
passed with 3 skipped; 52 browser tests passed across light/dark themes, including
36 refreshed core route screenshots and additional route/interaction/recovery
coverage. DESIGN.md lint has zero errors and warnings. `lingo-audit.json`
preserves the same 58 known Button/onPress scanner false positives; it is not
reported as passing. Native custom fonts, provider voice quality, physical-device
acceptance, human review, and hosted deployment remain separate.
